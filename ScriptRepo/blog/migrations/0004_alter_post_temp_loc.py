# Generated by Django 4.2.16 on 2024-10-05 08:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0003_alter_post_temp_loc'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='temp_loc',
            field=models.TextField(blank=True, null=True),
        ),
    ]
