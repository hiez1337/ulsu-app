import { Lesson, LessonType, Subgroup } from '../types';

export * from '../types';

export interface StudentInfo {
  name: string;
  birthDate: string;
  phone: string;
  email: string;
  faculty: string;
  level: string;
  specialty: string;
  profile: string;
  educationForm: string;
  basis: string;
  course: string;
  group: string;
}

/**
 * Parses raw lesson text from ULSU schedule into structured Lesson objects.
 * Handles subgroup dividers, subgroups, lesson types, rooms, and teachers.
 */
export function parseRawLessonText(
  num: number,
  time: string,
  rawText: string,
  dayIndex: number
): Lesson[] {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    return [];
  }

  // 1. Handles divider `---` (splits into 2 or more lessons)
  const parts = rawText
    .split(/\s*---\s*|\s*—{3,}\s*|\s*–{3,}\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [];
  }

  return parts.map((partText, partIdx) => {
    let remaining = partText;

    // 2. Extract subgroups (1п, 2п, 1 п, 2 п, default 'all')
    let subgroup: Subgroup = 'all';
    const subMatch = remaining.match(
      /(?:^|[\s(\[])(1|2)\s*(?:п|подгруппа|\.п)(?:[)\]\.]|\b|\s|$)/iu
    );
    if (subMatch) {
      const parsedSub = subMatch[1];
      if (parsedSub === '1' || parsedSub === '2') {
        subgroup = parsedSub;
      }
      remaining = remaining.replace(subMatch[0], ' ');
    }

    // 3. Extract rooms (3/118, 332, 2/20а, 505, online, etc.)
    let room = '';
    let building: string | undefined = undefined;

    const onlineMatch = remaining.match(
      /(?:^|[^\p{L}\p{N}])(Контур\s*Толк(?:\s*\([^)]*\))?|онлайн|online|дистант)(?=$|[^\p{L}\p{N}])/iu
    );
    const enterpriseMatch = remaining.match(
      /(?:^|[^\p{L}\p{N}])(Марс|Авиастар)(?=$|[^\p{L}\p{N}])/iu
    );
    const slashRoomMatch = remaining.match(
      /(?:^|[^\p{L}\p{N}])(\d{1,2}\/[\dA-Za-zА-Яа-я\.]+)(?=$|[^\p{L}\p{N}])/u
    );
    const numRoomMatch = remaining.match(
      /(?:^|[^\p{L}\p{N}])(\d{3}[а-яА-Яa-zA-Z]?)(?=$|[^\p{L}\p{N}])/u
    );

    if (onlineMatch) {
      room = onlineMatch[1].trim();
      building = 'Онлайн';
      remaining = remaining.replace(onlineMatch[0], ' ');
    } else if (enterpriseMatch) {
      room = enterpriseMatch[1].trim();
      building = enterpriseMatch[1].trim();
      remaining = remaining.replace(enterpriseMatch[0], ' ');
    } else if (slashRoomMatch) {
      room = slashRoomMatch[1].trim();
      building = room.split('/')[0];
      remaining = remaining.replace(slashRoomMatch[0], ' ');
    } else if (numRoomMatch) {
      room = numRoomMatch[1].trim();
      building = '1';
      remaining = remaining.replace(numRoomMatch[0], ' ');
    }

    // 4. Extract teachers (e.g. Н.Н.Нечаева, И.А.Санников, Ю.Ю.Фролова, В.Г.Бурмистрова)
    let teacher = '';
    let teacherInitials = '';
    const teacherPattern =
      /(?:^|[^\p{L}\p{N}])(\.?[А-ЯЁ]\s*[\.,]\s*[А-ЯЁ]\s*[\.,]\s*[А-ЯЁ][а-яё]+|[А-ЯЁ][а-яё]+\s+[А-ЯЁ]\s*[\.,]\s*[А-ЯЁ]\s*[\.,]|\.?[А-ЯЁ]\s*[\.,]\s*[А-ЯЁ][а-яё]+)(?=$|[^\p{L}\p{N}])/u;
    const teacherMatch = remaining.match(teacherPattern);
    if (teacherMatch) {
      let tRaw = teacherMatch[1].trim().replace(/^\./, '');
      tRaw = tRaw.replace(/,/g, '.');
      teacher = tRaw;

      const initMatch = tRaw.match(/([А-ЯЁ]\s*\.\s*[А-ЯЁ]\s*\.)/);
      if (initMatch) {
        teacherInitials = initMatch[1].replace(/\s+/g, '');
      } else {
        const singleInit = tRaw.match(/([А-ЯЁ]\s*\.)/);
        if (singleInit) {
          teacherInitials = singleInit[1].replace(/\s+/g, '');
        }
      }
      remaining = remaining.replace(teacherMatch[0], ' ');
    }

    // 5. Extract lesson types (лек, лаб, сем, прак)
    let type = 'Другое';
    let typeCode: LessonType = 'other';
    const typeMatch = remaining.match(
      /(?:^|[^\p{L}\p{N}])(лек\.?|лаб\.?|сем\.?|прак\.?|пр\.?)(?=$|[^\p{L}\p{N}])/iu
    );
    if (typeMatch) {
      const tWord = typeMatch[1].toLowerCase().replace('.', '');
      if (tWord.startsWith('лек')) {
        type = 'Лекция';
        typeCode = 'lecture';
      } else if (tWord.startsWith('лаб')) {
        type = 'Лабораторная';
        typeCode = 'lab';
      } else if (tWord.startsWith('сем')) {
        type = 'Семинар';
        typeCode = 'seminar';
      } else if (tWord.startsWith('прак') || tWord === 'пр') {
        type = 'Практика';
        typeCode = 'practice';
      }
      remaining = remaining.replace(typeMatch[0], ' ');
    } else if (/практика/i.test(remaining)) {
      type = 'Практика';
      typeCode = 'practice';
    }

    // 6. Clean extracted subject name
    let subject = remaining
      .replace(/[\n\r\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s,.;\-–—\/]+|[\s,.;\-–—\/]+$/g, '')
      .trim();

    // Remove repeated duplicated word if present in corrupted source data (e.g. 'графика графика')
    subject = subject.replace(/\b([А-Яа-яЁё]+)\s+\1\b/gu, '$1');

    // Fix known typos from raw schedule source
    subject = subject
      .replace(/Прфессиональный/gu, 'Профессиональный')
      .replace(/инстранный/gu, 'иностранный')
      .replace(/прозводства/gu, 'производства')
      .replace(/Продукиы м технологии/gu, 'Продукты и технологии');

    // Strip redundant trailing type abbreviation at end of subject title
    subject = subject.replace(/\s+(?:лаб|лек|сем|прак|пр)\.?$/iu, '').trim();

    const id = `lesson_${dayIndex}_${num}_${subgroup}_${partIdx}`;

    return {
      id,
      num,
      time,
      subject,
      type,
      typeCode,
      teacher,
      teacherInitials,
      room,
      building,
      subgroup,
      raw: partText,
    };
  });
}
