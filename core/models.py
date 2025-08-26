from django.db import models


class ClassRoom(models.Model):
    name = models.CharField(max_length=100)
    section = models.CharField(max_length=50, blank=True)

    class Meta:
        unique_together = ('name', 'section')
        ordering = ['name', 'section']

    def __str__(self):
        return f"{self.name}{(' - ' + self.section) if self.section else ''}"


class Student(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    roll_number = models.CharField(max_length=50)
    classroom = models.ForeignKey(ClassRoom, on_delete=models.PROTECT, related_name='students')
    guardian_name = models.CharField(max_length=200, blank=True)
    contact_phone = models.CharField(max_length=50, blank=True)
    contact_email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('roll_number', 'classroom')
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Attendance(models.Model):
    STATUS_PRESENT = 'present'
    STATUS_ABSENT = 'absent'
    STATUS_LATE = 'late'
    STATUS_CHOICES = [
        (STATUS_PRESENT, 'Present'),
        (STATUS_ABSENT, 'Absent'),
        (STATUS_LATE, 'Late'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PRESENT)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ('student', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.student} - {self.date} - {self.status}"


class Grade(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    subject = models.CharField(max_length=100)
    term = models.CharField(max_length=50)
    score = models.DecimalField(max_digits=6, decimal_places=2)
    max_score = models.DecimalField(max_digits=6, decimal_places=2, default=100)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']
        unique_together = ('student', 'subject', 'term')

    def __str__(self):
        return f"{self.student} - {self.subject} ({self.term})"

