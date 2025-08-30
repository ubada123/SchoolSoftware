from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from .models import ClassRoom, Student, Attendance, Grade, FeeStructure, Payment, AdminUser


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
            'classroom', 'classroom_detail', 'father_name', 'guardian_name', 'contact_phone',
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


class AdminUserSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    full_name = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    
    class Meta:
        model = AdminUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'status', 'is_superuser', 'is_staff', 'date_joined', 
            'last_login', 'created_by', 'created_by_name', 'notes', 'is_active', 'password'
        ]
        read_only_fields = ['date_joined', 'last_login', 'created_by', 'django_user']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return "System"
    
    def create(self, validated_data):
        # Set the created_by field to the current user
        validated_data['created_by'] = self.context['request'].user
        
        # Extract password for Django User creation
        password = validated_data.pop('password', None)
        
        # Create Django User object for authentication
        if password:
            django_user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=password,
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                is_staff=validated_data.get('is_staff', True),
                is_superuser=validated_data.get('is_superuser', False)
            )
            
            # Set the Django user reference in AdminUser
            validated_data['django_user'] = django_user
        
        # Create AdminUser object
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Handle password update
        password = validated_data.pop('password', None)
        
        if password and instance.django_user:
            # Update Django User password
            instance.django_user.set_password(password)
            instance.django_user.save()
        
        # Update Django User other fields if they exist
        if instance.django_user:
            if 'first_name' in validated_data:
                instance.django_user.first_name = validated_data['first_name']
            if 'last_name' in validated_data:
                instance.django_user.last_name = validated_data['last_name']
            if 'email' in validated_data:
                instance.django_user.email = validated_data['email']
            if 'is_staff' in validated_data:
                instance.django_user.is_staff = validated_data['is_staff']
            if 'is_superuser' in validated_data:
                instance.django_user.is_superuser = validated_data['is_superuser']
            instance.django_user.save()
        
        return super().update(instance, validated_data)


