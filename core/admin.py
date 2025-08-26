from django.contrib import admin
from .models import ClassRoom, Student, Attendance, Grade


@admin.register(ClassRoom)
class ClassRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'section')
    search_fields = ('name', 'section')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'roll_number', 'classroom')
    list_filter = ('classroom',)
    search_fields = ('first_name', 'last_name', 'roll_number')


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'status')
    list_filter = ('status', 'date')
    search_fields = ('student__first_name', 'student__last_name')


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'term', 'score', 'max_score')
    list_filter = ('subject', 'term')
    search_fields = ('student__first_name', 'student__last_name', 'subject')

