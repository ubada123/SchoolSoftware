from rest_framework import serializers
from .models import ClassRoom, Student, Attendance, Grade, FeeStructure, Payment


class ClassRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassRoom
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    classroom_detail = ClassRoomSerializer(source='classroom', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'date_of_birth', 'admission_date', 'roll_number',
            'classroom', 'classroom_detail', 'guardian_name', 'contact_phone',
            'contact_email', 'address', 'created_at', 'updated_at'
        ]


class AttendanceSerializer(serializers.ModelSerializer):
    student_detail = StudentSerializer(source='student', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'student', 'student_detail', 'date', 'status', 'notes']


class GradeSerializer(serializers.ModelSerializer):
    student_detail = StudentSerializer(source='student', read_only=True)

    class Meta:
        model = Grade
        fields = ['id', 'student', 'student_detail', 'subject', 'term', 'score', 'max_score', 'recorded_at']


class FeeStructureSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = [
            'id', 'classroom', 'classroom_name', 'fee_type', 'amount', 
            'frequency', 'description', 'created_at', 'updated_at'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    student_full_name = serializers.SerializerMethodField()
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = Payment
        fields = [
            'id', 'student', 'student_name', 'student_full_name', 'fee_type', 
            'amount', 'total_fee', 'total_paid', 'balance', 'payment_date', 
            'due_date', 'is_overdue', 'payment_method', 'receipt_number', 
            'notes', 'created_at'
        ]

    def get_student_full_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"


