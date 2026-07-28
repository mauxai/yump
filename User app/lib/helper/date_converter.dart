
import 'package:get/get.dart';
import 'package:intl/intl.dart';

class DateConverter {
  static String stringYear(DateTime? dateTime) {
    return DateFormat('y').format(dateTime!);
  }

  static String convertStringDateTo24HourFormat(String dateTime) {
    try {
      return DateFormat('HH:mm').format(DateFormat('hh:mm a').parse(dateTime));
    } catch (e) {
      return dateTime;
    }
  }

  static String formatDateString(String? raw, {String pattern = 'MMM d, yyyy'}) {
    if (raw == null || raw.isEmpty) return '';
    try {
      return DateFormat(pattern).format(DateTime.parse(raw).toLocal());
    } catch (_) {
      return raw;
    }
  }

  static String formatDateTime(DateTime dateTime, {String pattern = 'MMM d, yyyy'}) {
    return DateFormat(pattern).format(dateTime);
  }

  static String timeAgoFromString(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    try {
      final dt = DateTime.parse(raw).toLocal();
      final diff = DateTime.now().difference(dt);

      if (diff.inSeconds < 45) return 'time_just_now'.tr;
      if (diff.inMinutes < 1) return 'time_just_now'.tr;
      if (diff.inMinutes < 60) {
        return 'time_minutes_ago'.trParams({'count': '${diff.inMinutes}'});
      }
      if (diff.inHours < 24) {
        return 'time_hours_ago'.trParams({'count': '${diff.inHours}'});
      }
      if (diff.inDays < 7) {
        return 'time_days_ago'.trParams({'count': '${diff.inDays}'});
      }
      if (diff.inDays < 30) {
        final weeks = (diff.inDays / 7).floor();
        return 'time_weeks_ago'.trParams({'count': '$weeks'});
      }
      return DateFormat('MMM d, yyyy').format(dt);
    } catch (_) {
      return raw;
    }
  }
}













