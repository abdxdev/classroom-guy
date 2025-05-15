import {
  // Schedule retrieval functions
  getAllSchedules,
  getScheduleById,
  getSchedulesByDateRange,
  getSchedulesByCourseId,
  getSchedulesByTag,
  getSchedulesByDate,
  getSchedulesBeforeDate,
  
  // Schedule modification functions
  addNewSchedule,
  updateScheduleDescription,
  updateScheduleDate,
  updateScheduleTag,
  updateScheduleCourseId,
  updateSchedule,
  deleteSchedule,
  
  // Time table functions
  getTimeTableByCourseId,
  getAllTimeTables,
  
  // Course functions
  getAllCourses,
  getCourseById,
  
  // Utility functions
  getTime,
  getSlotAfter,
  getCollectionNames,
  runCustomDatabaseQuery
} from './modelFunctions';

async function runTests() {
  // Schedule Retrieval Tests
  console.log('\n=== Schedule Retrieval Tests ===');
  
  try {
    const schedules = await getAllSchedules();
    console.log('Schedules:', schedules);
    console.log('✓ getSchedules');
  } catch (err) {
    console.error('✕ getSchedules failed:', err instanceof Error ? err.message : err);
  }

  try {
    const schedulesByRange = await getSchedulesByDateRange(
      new Date('2025-07-01'),
      new Date('2025-07-31')
    );
    console.log('Schedules in range:', schedulesByRange);
    console.log('✓ getSchedulesByDateRange');
  } catch (err) {
    console.error('✕ getSchedulesByDateRange failed:', err instanceof Error ? err.message : err);
  }

  try {
    const schedulesByTag = await getSchedulesByTag('assignment');
    console.log('Schedules by tag:', schedulesByTag);
    console.log('✓ getSchedulesByTag');
  } catch (err) {
    console.error('✕ getSchedulesByTag failed:', err instanceof Error ? err.message : err);
  }

  try {
    const schedulesByDate = await getSchedulesByDate('2025-07-15');
    console.log('Schedules by date:', schedulesByDate);
    console.log('✓ getSchedulesByDate');
  } catch (err) {
    console.error('✕ getSchedulesByDate failed:', err instanceof Error ? err.message : err);
  }

  try {
    const schedulesBefore = await getSchedulesBeforeDate('2025-07-15');
    console.log('Schedules before date:', schedulesBefore);
    console.log('✓ getSchedulesBeforeDate');
  } catch (err) {
    console.error('✕ getSchedulesBeforeDate failed:', err instanceof Error ? err.message : err);
  }

  // Schedule Modification Tests
  console.log('\n=== Schedule Modification Tests ===');

  let testScheduleId: string | undefined;
  
  try {
    const newSchedule = await addNewSchedule({
      courseId: 'test123',
      description: 'Test Schedule',
      date: '2025-06-15',
      tagId: 'assignment'
    });
    testScheduleId = newSchedule._id?.toString();
    console.log('Added Schedule:', newSchedule);
    console.log('✓ addNewSchedule');
  } catch (err) {
    console.error('✕ addNewSchedule failed:', err instanceof Error ? err.message : err);
  }

  if (testScheduleId) {
    try {
      const updatedDesc = await updateScheduleDescription(testScheduleId, 'Updated description');
      console.log('Updated description:', updatedDesc);
      console.log('✓ updateScheduleDescription');
    } catch (err) {
      console.error('✕ updateScheduleDescription failed:', err instanceof Error ? err.message : err);
    }

    try {
      const updatedDate = await updateScheduleDate(testScheduleId, '2025-06-16');
      console.log('Updated date:', updatedDate);
      console.log('✓ updateScheduleDate');
    } catch (err) {
      console.error('✕ updateScheduleDate failed:', err instanceof Error ? err.message : err);
    }

    try {
      const updatedTag = await updateScheduleTag(testScheduleId, 'project');
      console.log('Updated tag:', updatedTag);
      console.log('✓ updateScheduleTag');
    } catch (err) {
      console.error('✕ updateScheduleTag failed:', err instanceof Error ? err.message : err);
    }

    try {
      const updatedCourse = await updateScheduleCourseId(testScheduleId, 'test124');
      console.log('Updated course:', updatedCourse);
      console.log('✓ updateScheduleCourseId');
    } catch (err) {
      console.error('✕ updateScheduleCourseId failed:', err instanceof Error ? err.message : err);
    }

    try {
      const deleted = await deleteSchedule(testScheduleId);
      console.log('Delete result:', deleted);
      console.log('✓ deleteSchedule');
    } catch (err) {
      console.error('✕ deleteSchedule failed:', err instanceof Error ? err.message : err);
    }
  }

  // Timetable Tests
  console.log('\n=== Timetable Tests ===');

  try {
    const timetables = await getAllTimeTables();
    console.log('All timetables:', timetables);
    console.log('✓ getAllTimeTables');
  } catch (err) {
    console.error('✕ getAllTimeTables failed:', err instanceof Error ? err.message : err);
  }

  try {
    const courseTimetable = await getTimeTableByCourseId('test123');
    console.log('Course timetable:', courseTimetable);
    console.log('✓ getTimeTableByCourseId');
  } catch (err) {
    console.error('✕ getTimeTableByCourseId failed:', err instanceof Error ? err.message : err);
  }

  // Course Tests
  console.log('\n=== Course Tests ===');

  try {
    const courses = await getAllCourses();
    console.log('All courses:', courses);
    console.log('✓ getAllCourses');
  } catch (err) {
    console.error('✕ getAllCourses failed:', err instanceof Error ? err.message : err);
  }

  try {
    const course = await getCourseById('test123');
    console.log('Course by ID:', course);
    console.log('✓ getCourseById');
  } catch (err) {
    console.error('✕ getCourseById failed:', err instanceof Error ? err.message : err);
  }

  // Utility Tests
  console.log('\n=== Utility Tests ===');

  try {
    const currentTime = getTime();
    console.log('Current time:', currentTime);
    console.log('✓ getTime');
  } catch (err) {
    console.error('✕ getTime failed:', err instanceof Error ? err.message : err);
  }

  try {
    const nextSlot = await getSlotAfter('test123', '2025-06-15');
    console.log('Next available slot:', nextSlot);
    console.log('✓ getSlotAfter');
  } catch (err) {
    console.error('✕ getSlotAfter failed:', err instanceof Error ? err.message : err);
  }

  try {
    const collections = await getCollectionNames();
    console.log('Collections:', collections);
    console.log('✓ getCollectionNames');
  } catch (err) {
    console.error('✕ getCollectionNames failed:', err instanceof Error ? err.message : err);
  }

  try {
    const queryResult = await runCustomDatabaseQuery('{ "find": "schedules" }');
    console.log('Custom query result:', queryResult);
    console.log('✓ runCustomDatabaseQuery');
  } catch (err) {
    console.error('✕ runCustomDatabaseQuery failed:', err instanceof Error ? err.message : err);
  }
}

// Run all tests
runTests();