from django.contrib import admin
from .models import ClassRoom, Student, Attendance, Grade, FeeStructure, Payment


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


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ('classroom', 'fee_type', 'amount', 'frequency')
    list_filter = ('classroom', 'fee_type', 'frequency')
    search_fields = ('classroom__name', 'description')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('student', 'fee_type', 'amount', 'payment_date', 'payment_method')
    list_filter = ('fee_type', 'payment_method', 'payment_date')
    search_fields = ('student__first_name', 'student__last_name', 'receipt_number')

