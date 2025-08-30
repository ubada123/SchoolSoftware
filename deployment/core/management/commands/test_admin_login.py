from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import AdminUser
from rest_framework_simplejwt.tokens import RefreshToken

class Command(BaseCommand):
    help = 'Test admin user login functionality'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to test')
        parser.add_argument('password', type=str, help='Password to test')

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        
        try:
            # Try to authenticate the user
            user = User.objects.get(username=username)
            
            if user.check_password(password):
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Login successful for user: {username}')
                )
                
                # Check if this user has an AdminUser profile
                try:
                    admin_user = AdminUser.objects.get(django_user=user)
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ AdminUser profile found: {admin_user.full_name}')
                    )
                    self.stdout.write(
                        self.style.SUCCESS(f'   Role: {admin_user.role}')
                    )
                    self.stdout.write(
                        self.style.SUCCESS(f'   Status: {admin_user.status}')
                    )
                except AdminUser.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f'⚠️  No AdminUser profile found for {username}')
                    )
                
                # Generate JWT token
                refresh = RefreshToken.for_user(user)
                self.stdout.write(
                    self.style.SUCCESS(f'✅ JWT Token generated successfully')
                )
                self.stdout.write(f'   Access Token: {refresh.access_token}')
                
            else:
                self.stdout.write(
                    self.style.ERROR(f'❌ Invalid password for user: {username}')
                )
                
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ User not found: {username}')
            )
