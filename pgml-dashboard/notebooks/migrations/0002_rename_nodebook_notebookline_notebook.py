# Generated by Django 4.0.6 on 2022-08-08 17:58

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("notebooks", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="notebookline",
            old_name="nodebook",
            new_name="notebook",
        ),
    ]
