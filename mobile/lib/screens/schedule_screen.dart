// lib/screens/schedule_screen.dart
import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // for haptics & clipboard
import 'package:lucide_icons/lucide_icons.dart';

import '../theme.dart';
import '../styles/card_ui_styles.dart';
import '../services/api_service.dart';
import '../services/friends_api.dart';

/// ---------- MODELS ----------

class FriendDto {
  final String id;
  final String? email;
  final String? firstName;
  final String? lastName;

  FriendDto({required this.id, this.email, this.firstName, this.lastName});

  factory FriendDto.fromJson(Map<String, dynamic> json) {
    return FriendDto(
      id: (json['_id'] ?? json['id'] ?? json['userId'] ?? '').toString(),
      email: json['email']?.toString(),
      firstName: json['firstName']?.toString(),
      lastName: json['lastName']?.toString(),
    );
  }

  String displayName() {
    final fn = (firstName ?? '').trim();
    final ln = (lastName ?? '').trim();
    final name = ('$fn $ln').trim();
    if (name.isNotEmpty) return name;
    return email ?? 'Unknown';
  }
}

class SuggestionSlot {
  final String startIso;
  final String endIso;

  SuggestionSlot({required this.startIso, required this.endIso});
}

/// ---------- SCREEN ----------

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  // ---------- STATE ----------
  final List<FriendDto> _friends = [];
  String? _selectedFriendId;

  String _startDate = ''; // yyyy-MM-dd
  String _endDate = ''; // yyyy-MM-dd
  String _meetingTitle = '';
  String _duration = '60';

  String _workStart = '09:00'; // HH:mm
  String _workEnd = '17:00'; // HH:mm
  String _timezone = 'America/New_York';

  bool _loading = false;
  bool _initialLoading = true; // for skeleton while loading

  // validation flags for required fields
  bool _friendError = false;
  bool _startDateError = false;
  bool _endDateError = false;
  bool _meetingTitleError = false;

  String? _currentUserId;
  final List<SuggestionSlot> _suggestions = [];

  @override
  void initState() {
    super.initState();

    // Default: start = tomorrow, end = 3 days after that (like TS)
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    final end = tomorrow.add(const Duration(days: 3));
    _startDate = _formatDateForInput(tomorrow);
    _endDate = _formatDateForInput(end);

    _initData();
  }

  // ---------- INIT: friends + current user ----------
  Future<void> _initData() async {
    try {
      // 1) Load friends
      final friendsRes = await FriendsApi.getFriends();
      final friendsJson = (friendsRes['friends'] as List<dynamic>? ?? []);
      final loadedFriends = friendsJson
          .map((f) => FriendDto.fromJson(f as Map<String, dynamic>))
          .where((f) => f.id.isNotEmpty)
          .toList();

      // 2) Load current user id from /me
      final meRes = await ApiService.api('/me');
      String? userId;
      if (meRes.statusCode == 200) {
        final data = json.decode(meRes.body) as Map<String, dynamic>;
        final user = data['user'] as Map<String, dynamic>? ?? {};
        userId = (user['_id'] ?? user['id'] ?? user['userId'])?.toString();
      }

      if (!mounted) return;
      setState(() {
        _friends
          ..clear()
          ..addAll(loadedFriends);
        _currentUserId = userId;
      });
    } catch (e) {
      debugPrint('Failed to init schedule data: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to load friends / user info')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _initialLoading = false;
        });
      }
    }
  }

  // ---------- HELPERS ----------
  String _formatDateForInput(DateTime d) {
    final year = d.year.toString().padLeft(4, '0');
    final month = d.month.toString().padLeft(2, '0');
    final day = d.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }

  String _formatDateLabelShort(String isoOrDate) {
    DateTime d;
    if (isoOrDate.length <= 10) {
      // yyyy-MM-dd
      d = DateTime.parse('${isoOrDate}T00:00:00');
    } else {
      d = DateTime.parse(isoOrDate);
    }
    d = d.toLocal();

    final mm = d.month.toString().padLeft(2, '0');
    final dd = d.day.toString().padLeft(2, '0');
    final yyyy = d.year.toString();
    return '$mm/$dd/$yyyy'; // e.g. 11/18/2025
  }

  String _formatDateLabel(String isoOrDate) {
    DateTime d;
    if (isoOrDate.length <= 10) {
      // yyyy-MM-dd
      d = DateTime.parse('${isoOrDate}T00:00:00');
    } else {
      d = DateTime.parse(isoOrDate);
    }
    d = d.toLocal();

    const weekdays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    final weekday = weekdays[d.weekday - 1];
    final month = months[d.month - 1];
    return '$weekday, $month ${d.day}';
  }

  String _formatTimeLabel(BuildContext context, String iso) {
    final dt = DateTime.parse(iso).toLocal();
    final tod = TimeOfDay.fromDateTime(dt);
    return MaterialLocalizations.of(
      context,
    ).formatTimeOfDay(tod, alwaysUse24HourFormat: false);
  }

  String _friendInitial(FriendDto? f) {
    final name = f?.displayName() ?? '';
    if (name.isEmpty) return '?';
    return name[0].toUpperCase();
  }

  String _formatHmLabel(BuildContext context, String hm) {
    final parts = hm.split(':');
    if (parts.length < 2) return hm;
    final hour = int.tryParse(parts[0]) ?? 0;
    final minute = int.tryParse(parts[1]) ?? 0;
    final dt = DateTime(2025, 1, 1, hour, minute);
    final tod = TimeOfDay.fromDateTime(dt);
    return MaterialLocalizations.of(
      context,
    ).formatTimeOfDay(tod, alwaysUse24HourFormat: false);
  }

  // ---------- UI HELPERS (cards + modals) ----------

  BoxDecoration get _sectionDecoration => BoxDecoration(
    color: AppColors.beige.withOpacity(0.95),
    borderRadius: BorderRadius.circular(16),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.18),
        blurRadius: 10,
        offset: const Offset(0, 4),
      ),
    ],
  );

  BoxDecoration _modalDecoration() => BoxDecoration(
    color: AppColors.beige.withOpacity(0.97),
    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
  );

  Widget _buildHandleBar() {
    return Container(
      width: 40,
      height: 4,
      decoration: BoxDecoration(
        color: Colors.black26,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  Widget _buildSectionTileContent({
    required BuildContext context,
    required String label,
    required String value,
    required VoidCallback onTap,
    IconData? leadingIcon,
    bool required = false,
    bool hasError = false,
  }) {
    final textTheme = Theme.of(context).textTheme;

    final baseLabelStyle = textTheme.labelMedium?.copyWith(
      color: hasError ? Colors.red[700] : AppColors.accentTeal,
    );

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        child: Row(
          children: [
            if (leadingIcon != null) ...[
              Icon(leadingIcon, size: 20, color: AppColors.accentTeal),
              const SizedBox(width: 10),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(text: label, style: baseLabelStyle),
                        if (required)
                          TextSpan(
                            text: ' *',
                            style: baseLabelStyle?.copyWith(color: Colors.red),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.darkTeal,
                    ),
                  ),
                  if (hasError)
                    Padding(
                      padding: const EdgeInsets.only(top: 2.0),
                      child: Text(
                        'This field is required',
                        style: textTheme.bodySmall?.copyWith(
                          color: Colors.red[700],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: AppColors.accentTeal),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTile({
    required BuildContext context,
    required String label,
    required String value,
    required VoidCallback onTap,
    IconData? leadingIcon,
    bool required = false,
    bool hasError = false,
  }) {
    final decoration = _sectionDecoration.copyWith(
      border: hasError ? Border.all(color: Colors.redAccent, width: 1.2) : null,
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: decoration,
      child: _buildSectionTileContent(
        context: context,
        label: label,
        value: value,
        onTap: onTap,
        leadingIcon: leadingIcon,
        required: required,
        hasError: hasError,
      ),
    );
  }

  // special row layout for work hours: start/end side by side
  Widget _buildWorkHoursRow(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Container(
            margin: const EdgeInsets.only(right: 6, bottom: 12),
            decoration: _sectionDecoration,
            child: _buildSectionTileContent(
              context: context,
              label: 'Start Time',
              value: _formatHmLabel(context, _workStart),
              onTap: () async {
                final newHm = await _pickTime(_workStart);
                if (newHm != null) {
                  setState(() {
                    _workStart = newHm;
                  });
                }
              },
              leadingIcon: LucideIcons.sunrise,
            ),
          ),
        ),
        Expanded(
          child: Container(
            margin: const EdgeInsets.only(left: 6, bottom: 12),
            decoration: _sectionDecoration,
            child: _buildSectionTileContent(
              context: context,
              label: 'End Time',
              value: _formatHmLabel(context, _workEnd),
              onTap: () async {
                final newHm = await _pickTime(_workEnd);
                if (newHm != null) {
                  setState(() {
                    _workEnd = newHm;
                  });
                }
              },
              leadingIcon: LucideIcons.sunset,
            ),
          ),
        ),
      ],
    );
  }

  // row layout for Start Date / End Date side by side
  Widget _buildDateRangeRow(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Container(
            margin: const EdgeInsets.only(right: 6, bottom: 12),
            decoration: _sectionDecoration.copyWith(
              border: _startDateError
                  ? Border.all(color: Colors.redAccent, width: 1.2)
                  : null,
            ),
            child: _buildSectionTileContent(
              context: context,
              label: 'Start Date',
              value: _startDate.isEmpty
                  ? 'Select date'
                  : _formatDateLabelShort(_startDate),
              onTap: () async {
                final initialDate =
                    DateTime.tryParse('${_startDate}T00:00:00') ??
                    DateTime.now().add(const Duration(days: 1));

                final picked = await showDatePicker(
                  context: context,
                  initialDate: initialDate,
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (picked != null) {
                  setState(() {
                    _startDate = _formatDateForInput(picked);
                    _startDateError = false;

                    // if end date is before new start date, clear it
                    if (_endDate.isNotEmpty) {
                      final end = DateTime.tryParse('${_endDate}T00:00:00');
                      final start = DateTime.tryParse('${_startDate}T00:00:00');
                      if (end != null && start != null && end.isBefore(start)) {
                        _endDate = '';
                        _endDateError = true;
                      }
                    }
                  });
                }
              },
              leadingIcon: LucideIcons.calendarDays,
              required: true,
              hasError: _startDateError,
            ),
          ),
        ),
        Expanded(
          child: Container(
            margin: const EdgeInsets.only(left: 6, bottom: 12),
            decoration: _sectionDecoration.copyWith(
              border: _endDateError
                  ? Border.all(color: Colors.redAccent, width: 1.2)
                  : null,
            ),
            child: _buildSectionTileContent(
              context: context,
              label: 'End Date',
              value: _endDate.isEmpty
                  ? 'Select date'
                  : _formatDateLabelShort(_endDate),
              onTap: () async {
                final baseDate = _startDate.isNotEmpty
                    ? DateTime.tryParse('${_startDate}T00:00:00') ??
                          DateTime.now().add(const Duration(days: 1))
                    : DateTime.now().add(const Duration(days: 1));
                final picked = await showDatePicker(
                  context: context,
                  initialDate: baseDate,
                  firstDate: baseDate,
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (picked != null) {
                  setState(() {
                    _endDate = _formatDateForInput(picked);
                    _endDateError = false;
                  });
                }
              },
              leadingIcon: LucideIcons.calendarRange,
              required: true,
              hasError: _endDateError,
            ),
          ),
        ),
      ],
    );
  }

  // ---------- MODALS ----------

  Future<String?> _pickFriend() async {
    return showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        final textTheme = Theme.of(ctx).textTheme;

        if (_friends.isEmpty) {
          return SafeArea(
            child: Container(
              decoration: _modalDecoration(),
              padding: const EdgeInsets.all(16.0),
              child: SizedBox(
                height: 140,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildHandleBar(),
                    const SizedBox(height: 16),
                    Text(
                      'No friends yet',
                      style: textTheme.bodyMedium?.copyWith(
                        color: AppColors.darkTeal,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        return SafeArea(
          child: Container(
            decoration: _modalDecoration(),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildHandleBar(),
                const SizedBox(height: 12),
                Text(
                  'Select Friend',
                  style: textTheme.titleMedium?.copyWith(
                    color: AppColors.darkTeal,
                  ),
                ),
                const SizedBox(height: 8),
                Flexible(
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: _friends.length,
                    itemBuilder: (context, index) {
                      final f = _friends[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppColors.gold.withOpacity(0.9),
                          child: Text(
                            _friendInitial(f),
                            style: textTheme.bodyMedium?.copyWith(
                              color: AppColors.darkTeal,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        title: Text(
                          f.displayName(),
                          style: textTheme.bodyMedium?.copyWith(
                            color: AppColors.darkTeal,
                          ),
                        ),
                        subtitle: f.email != null
                            ? Text(
                                f.email!,
                                style: textTheme.bodySmall?.copyWith(
                                  color: AppColors.accentTeal,
                                ),
                              )
                            : null,
                        onTap: () => Navigator.of(context).pop(f.id),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<String?> _pickDuration() async {
    const options = [
      {'value': '30', 'label': '30 minutes'},
      {'value': '60', 'label': '1 hour'},
      {'value': '90', 'label': '1.5 hours'},
      {'value': '120', 'label': '2 hours'},
    ];

    int initialIndex = options.indexWhere((opt) => opt['value'] == _duration);
    if (initialIndex < 0) initialIndex = 1; // default to 60 minutes

    int selectedIndex = initialIndex;
    final controller = FixedExtentScrollController(initialItem: initialIndex);

    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        final textTheme = Theme.of(ctx).textTheme;

        return SafeArea(
          child: Container(
            decoration: _modalDecoration(),
            padding: const EdgeInsets.only(top: 12, bottom: 16),
            height: 260,
            child: Column(
              children: [
                _buildHandleBar(),
                const SizedBox(height: 8),
                Text(
                  'Meeting Duration',
                  style: textTheme.titleMedium?.copyWith(
                    color: AppColors.darkTeal,
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: CupertinoPicker(
                    scrollController: controller,
                    itemExtent: 38,
                    onSelectedItemChanged: (index) {
                      selectedIndex = index;
                    },
                    children: options
                        .map(
                          (opt) => Center(
                            child: Text(
                              opt['label']!,
                              style: textTheme.bodyMedium?.copyWith(
                                color: AppColors.darkTeal,
                                fontSize: 17,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: Padding(
                    padding: const EdgeInsets.only(right: 16.0),
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.darkTeal,
                        foregroundColor: AppColors.gold,
                      ),
                      onPressed: () {
                        Navigator.of(ctx).pop(options[selectedIndex]['value']!);
                      },
                      child: Text(
                        'Done',
                        style: textTheme.bodyMedium?.copyWith(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<String?> _pickTimezone() async {
    final controller = TextEditingController(text: _timezone);
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        final textTheme = Theme.of(ctx).textTheme;

        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: SafeArea(
            child: Container(
              decoration: _modalDecoration(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(child: _buildHandleBar()),
                  const SizedBox(height: 12),
                  Text(
                    'Timezone',
                    style: textTheme.titleMedium?.copyWith(
                      color: AppColors.darkTeal,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: controller,
                    style: textTheme.bodyMedium?.copyWith(
                      color: AppColors.darkTeal,
                    ),
                    decoration: InputDecoration(
                      border: const OutlineInputBorder(),
                      labelText: 'IANA Timezone (e.g. America/New_York)',
                      labelStyle: textTheme.bodySmall?.copyWith(
                        color: AppColors.accentTeal,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerRight,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.darkTeal,
                        foregroundColor: AppColors.gold,
                      ),
                      onPressed: () {
                        Navigator.of(ctx).pop(controller.text.trim());
                      },
                      child: Text(
                        'Save',
                        style: textTheme.bodyMedium?.copyWith(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // Meeting Title modal – similar styling to Timezone
  Future<String?> _pickMeetingTitle() async {
    final controller = TextEditingController(text: _meetingTitle);
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        final textTheme = Theme.of(ctx).textTheme;

        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: SafeArea(
            child: Container(
              decoration: _modalDecoration(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(child: _buildHandleBar()),
                  const SizedBox(height: 12),
                  Text(
                    'Meeting Title',
                    style: textTheme.titleMedium?.copyWith(
                      color: AppColors.darkTeal,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: controller,
                    style: textTheme.bodyMedium?.copyWith(
                      color: AppColors.darkTeal,
                    ),
                    decoration: InputDecoration(
                      border: const OutlineInputBorder(),
                      labelText: 'E.g. Project discussion',
                      labelStyle: textTheme.bodySmall?.copyWith(
                        color: AppColors.accentTeal,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerRight,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.darkTeal,
                        foregroundColor: AppColors.gold,
                      ),
                      onPressed: () {
                        Navigator.of(ctx).pop(controller.text.trim());
                      },
                      child: Text(
                        'Save',
                        style: textTheme.bodyMedium?.copyWith(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Future<String?> _pickTime(String currentHm) async {
    // Parse current time
    final parts = currentHm.split(':');
    int hour24 = int.tryParse(parts[0]) ?? 9;
    int minute = int.tryParse(parts[1]) ?? 0;

    bool isPm = hour24 >= 12;
    int hour12 = hour24 % 12;
    if (hour12 == 0) hour12 = 12;

    int selectedHour12 = hour12;
    int selectedMinute = minute;
    int selectedPeriodIndex = isPm ? 1 : 0;

    final hourController = FixedExtentScrollController(
      initialItem: selectedHour12 - 1,
    );
    final minuteController = FixedExtentScrollController(
      initialItem: selectedMinute,
    );
    final periodController = FixedExtentScrollController(
      initialItem: selectedPeriodIndex,
    );

    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        final textTheme = Theme.of(ctx).textTheme;

        return SafeArea(
          child: Container(
            decoration: _modalDecoration(),
            padding: const EdgeInsets.only(top: 12, bottom: 16),
            height: 260,
            child: Column(
              children: [
                _buildHandleBar(),
                const SizedBox(height: 8),
                Text(
                  'Select Time',
                  style: textTheme.titleMedium?.copyWith(
                    color: AppColors.darkTeal,
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Hours
                      Expanded(
                        child: CupertinoPicker(
                          scrollController: hourController,
                          itemExtent: 38,
                          onSelectedItemChanged: (index) {
                            selectedHour12 = index + 1;
                          },
                          children: List.generate(
                            12,
                            (i) => Center(
                              child: Text(
                                '${i + 1}',
                                style: textTheme.bodyMedium?.copyWith(
                                  color: AppColors.darkTeal,
                                  fontSize: 17,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const Text(
                        ':',
                        style: TextStyle(color: AppColors.darkTeal),
                      ),
                      // Minutes
                      Expanded(
                        child: CupertinoPicker(
                          scrollController: minuteController,
                          itemExtent: 38,
                          onSelectedItemChanged: (index) {
                            selectedMinute = index;
                          },
                          children: List.generate(
                            60,
                            (i) => Center(
                              child: Text(
                                i.toString().padLeft(2, '0'),
                                style: textTheme.bodyMedium?.copyWith(
                                  color: AppColors.darkTeal,
                                  fontSize: 17,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      // AM/PM
                      Expanded(
                        child: CupertinoPicker(
                          scrollController: periodController,
                          itemExtent: 38,
                          onSelectedItemChanged: (index) {
                            selectedPeriodIndex = index;
                          },
                          children: [
                            Center(
                              child: Text(
                                'AM',
                                style: textTheme.bodyMedium?.copyWith(
                                  color: AppColors.darkTeal,
                                  fontSize: 17,
                                ),
                              ),
                            ),
                            Center(
                              child: Text(
                                'PM',
                                style: textTheme.bodyMedium?.copyWith(
                                  color: AppColors.darkTeal,
                                  fontSize: 17,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: Padding(
                    padding: const EdgeInsets.only(right: 16.0),
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.darkTeal,
                        foregroundColor: AppColors.gold,
                      ),
                      onPressed: () {
                        final isPmLocal = selectedPeriodIndex == 1;
                        int h24 = selectedHour12 % 12;
                        if (isPmLocal) h24 += 12;
                        final newHm =
                            '${h24.toString().padLeft(2, '0')}:${selectedMinute.toString().padLeft(2, '0')}';
                        Navigator.of(ctx).pop(newHm);
                      },
                      child: Text(
                        'Done',
                        style: textTheme.bodyMedium?.copyWith(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ---------- BEST-TIME MODAL (3 slots) ----------
  Future<void> _showSlotsModal(List<SuggestionSlot> slots) async {
    FriendDto? selectedFriend;
    if (_selectedFriendId != null) {
      try {
        selectedFriend = _friends.firstWhere((f) => f.id == _selectedFriendId);
      } catch (_) {
        selectedFriend = null;
      }
    }

    final friendName = selectedFriend?.displayName() ?? 'Friend';
    final friendInitialChar = _friendInitial(selectedFriend);

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: false,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        final textTheme = Theme.of(ctx).textTheme;

        return SafeArea(
          child: Container(
            decoration: _modalDecoration(),
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(child: _buildHandleBar()),
                const SizedBox(height: 12),

                // header: avatar + meeting info
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [
                            AppColors.gold,
                            AppColors.gold.withOpacity(0.7),
                          ],
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        friendInitialChar,
                        style: textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: AppColors.darkTeal,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _meetingTitle.isNotEmpty
                                ? '$_meetingTitle with $friendName'
                                : 'Meeting with $friendName',
                            style: textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                              fontSize: 19,
                              color: AppColors.darkTeal,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '$_duration minute meeting ',
                            style: textTheme.bodyMedium?.copyWith(
                              color: AppColors.darkTeal,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                Text(
                  'Available time slots (${slots.length})',
                  style: textTheme.titleMedium?.copyWith(
                    color: const Color.fromARGB(255, 190, 161, 65),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),

                Expanded(
                  child: ListView.separated(
                    itemCount: slots.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (ctx, index) {
                      final slot = slots[index];
                      final startLabel = _formatTimeLabel(ctx, slot.startIso);
                      final endLabel = _formatTimeLabel(ctx, slot.endIso);
                      final dateLabel = _formatDateLabelShort(slot.startIso);

                      return Container(
                        decoration: _sectionDecoration,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            vertical: 12,
                            horizontal: 16,
                          ),
                          child: Row(
                            children: [
                              // Square icon with slot label + timing/day
                              Container(
                                width: 64,
                                height: 64,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  gradient: LinearGradient(
                                    colors: [
                                      AppColors.gold,
                                      AppColors.gold.withOpacity(0.8),
                                    ],
                                  ),
                                ),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 6,
                                  horizontal: 4,
                                ),
                                child: Column(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceEvenly,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Text(
                                      'Slot ${index + 1}',
                                      style: textTheme.bodySmall?.copyWith(
                                        color: AppColors.darkTeal,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    // Text(
                                    //   '$startLabel',
                                    //   textAlign: TextAlign.center,
                                    //   style: textTheme.bodySmall?.copyWith(
                                    //     color: AppColors.darkTeal,
                                    //     fontSize: 11,
                                    //   ),
                                    // ),
                                    // Text(
                                    //   dateLabel,
                                    //   textAlign: TextAlign.center,
                                    //   style: textTheme.bodySmall?.copyWith(
                                    //     color: AppColors.darkTeal,
                                    //     fontSize: 10,
                                    //   ),
                                    // ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              // Text details to the right
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '$startLabel – $endLabel',
                                      style: textTheme.bodyMedium?.copyWith(
                                        color: AppColors.darkTeal,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      dateLabel,
                                      style: textTheme.bodySmall?.copyWith(
                                        color: AppColors.accentTeal,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),

                Align(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.darkTeal,
                      foregroundColor: AppColors.gold,
                    ),
                    onPressed: () => Navigator.of(ctx).pop(),
                    child: Text(
                      'Close',
                      style: textTheme.bodyMedium?.copyWith(
                        color: AppColors.gold,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ---------- AVAILABILITY / findSequentialSlots ----------
  Future<List<SuggestionSlot>> _findSequentialSlots({
    required String userA,
    required String userB,
    required String startDateStr, // yyyy-MM-dd
    required String endDateStr, // yyyy-MM-dd
    required int minutes,
    required String tz,
    required String workStart,
    required String workEnd,
  }) async {
    const apiStartTime = '00:00';
    const apiEndTime = '23:59';
    const int maxSlots = 3;
    const int gapMinutes = 0; // same as TS GAP_MINUTES

    DateTime currentStart = DateTime.parse(
      '${startDateStr}T$apiStartTime:00',
    ); // local
    final DateTime windowEnd = DateTime.parse(
      '${endDateStr}T$apiEndTime:00',
    ); // local

    final List<SuggestionSlot> results = [];

    while (results.length < maxSlots && currentStart.isBefore(windowEnd)) {
      final startIso = currentStart.toUtc().toIso8601String();
      final endIso = windowEnd.toUtc().toIso8601String();

      final workStartHour = int.tryParse(workStart.split(':').first) ?? 9;
      final workEndHour = int.tryParse(workEnd.split(':').first) ?? 17;

      final queryParams = {
        'userA': userA,
        'userB': userB,
        'minutes': minutes.toString(),
        'start': startIso,
        'end': endIso,
        'tz': tz,
        'workStart': workStartHour.toString(),
        'workEnd': workEndHour.toString(),
      };

      final queryString = Uri(queryParameters: queryParams).query;

      final res = await ApiService.api(
        '/availability/first?$queryString',
        method: 'GET',
      );

      if (res.statusCode != 200) {
        final text = res.body;
        throw Exception(text.isNotEmpty ? text : 'Request failed');
      }

      final data = json.decode(res.body) as Map<String, dynamic>;

      // Handle "no_slot"
      if (data['ok'] == false && data['error'] == 'no_slot') {
        break;
      }

      // Other error
      if (data['error'] != null && data['error'] != 'no_slot') {
        throw Exception(data['error'].toString());
      }

      // Normalize slot shape as in TS:
      Map<String, dynamic>? first;
      if (data['slot'] != null) {
        first = Map<String, dynamic>.from(data['slot']);
      } else if (data['firstSlot'] != null) {
        first = Map<String, dynamic>.from(data['firstSlot']);
      } else if (data['slotStart'] != null && data['slotEnd'] != null) {
        first = {'start': data['slotStart'], 'end': data['slotEnd']};
      } else if (data['slots'] is List && (data['slots'] as List).isNotEmpty) {
        first = Map<String, dynamic>.from((data['slots'] as List).first);
      }

      if (first == null ||
          first['start'] == null ||
          first['end'] == null ||
          first['start'].toString().isEmpty ||
          first['end'].toString().isEmpty) {
        // No more slots
        break;
      }

      final slot = SuggestionSlot(
        startIso: first['start'].toString(),
        endIso: first['end'].toString(),
      );

      results.add(slot);

      // move currentStart to just after this slot plus gap
      DateTime slotEnd = DateTime.parse(slot.endIso);
      currentStart = slotEnd.add(const Duration(minutes: gapMinutes));
    }

    return results;
  }

  // ---------- ACTION: find time ----------
  Future<void> _handleFindTime() async {
    // light haptic on CTA press
    HapticFeedback.lightImpact();

    final bool missingFriend =
        _selectedFriendId == null || _selectedFriendId!.isEmpty;
    final bool missingStart = _startDate.isEmpty;
    final bool missingEnd = _endDate.isEmpty;
    final bool missingTitle = _meetingTitle.trim().isEmpty;

    if (missingFriend || missingStart || missingEnd || missingTitle) {
      setState(() {
        _friendError = missingFriend;
        _startDateError = missingStart;
        _endDateError = missingEnd;
        _meetingTitleError = missingTitle;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all required fields')),
      );
      HapticFeedback.mediumImpact();
      return;
    }

    // validate start <= end
    final startD = DateTime.tryParse('${_startDate}T00:00:00');
    final endD = DateTime.tryParse('${_endDate}T00:00:00');
    if (startD != null && endD != null && endD.isBefore(startD)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('End date must be on or after the start date.'),
        ),
      );
      HapticFeedback.mediumImpact();
      return;
    }

    if (_currentUserId == null || _currentUserId!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You must be logged in before finding a time.'),
        ),
      );
      HapticFeedback.mediumImpact();
      return;
    }

    setState(() {
      _loading = true;
    });

    final durationMinutes = int.tryParse(_duration) ?? 30;

    try {
      final slots = await _findSequentialSlots(
        userA: _currentUserId!,
        userB: _selectedFriendId!,
        startDateStr: _startDate,
        endDateStr: _endDate,
        minutes: durationMinutes,
        tz: _timezone,
        workStart: _workStart,
        workEnd: _workEnd,
      );

      if (!mounted) return;

      if (slots.isEmpty) {
        setState(() {
          _suggestions.clear();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No available times found in this window'),
          ),
        );
        HapticFeedback.mediumImpact();
      } else {
        setState(() {
          _suggestions
            ..clear()
            ..addAll(slots);
        });
        HapticFeedback.lightImpact();
        await _showSlotsModal(slots);
      }
    } catch (e) {
      debugPrint('availability error: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
      HapticFeedback.mediumImpact();
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  // ---------- UI ----------
  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final bool canSubmit = !_loading && _selectedFriendId != null;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [AppColors.darkTeal, AppColors.accentTeal],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // scrollable content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Cinzel header (matches other screens)
                                Text(
                                  'Find the Perfect Time',
                                  style: textTheme.headlineMedium?.copyWith(
                                    color: AppColors.gold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                // Cormorant subtitle
                                Text(
                                  'Combine schedules to discover your Kairos',
                                  style: textTheme.titleMedium?.copyWith(
                                    color: AppColors.bronze,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const EgyptianBorder(),
                      const SizedBox(height: 16),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        transitionBuilder: (child, animation) {
                          return FadeTransition(
                            opacity: animation,
                            child: SlideTransition(
                              position: Tween<Offset>(
                                begin: const Offset(0, 0.02),
                                end: Offset.zero,
                              ).animate(animation),
                              child: child,
                            ),
                          );
                        },
                        child: _buildFormView(context),
                      ),
                    ],
                  ),
                ),
              ),

              // ---------- BIG CENTERED CTA ----------
              SafeArea(
                top: false,
                minimum: const EdgeInsets.only(left: 24, right: 24, bottom: 24),
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 420),
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.4),
                            blurRadius: 18,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: ElevatedButton.icon(
                        style:
                            ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                              ),
                              minimumSize: const Size.fromHeight(56),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(24),
                                side: BorderSide(
                                  color: AppColors.gold,
                                  width: 2,
                                ),
                              ),
                              backgroundColor: AppColors.darkTeal,
                              foregroundColor: AppColors.gold,
                              elevation: 0, // shadow handled by DecoratedBox
                            ).copyWith(
                              backgroundColor:
                                  MaterialStateProperty.resolveWith((states) {
                                    if (states.contains(
                                      MaterialState.disabled,
                                    )) {
                                      return AppColors.accentTeal;
                                    }
                                    return AppColors.darkTeal;
                                  }),
                              foregroundColor:
                                  MaterialStateProperty.resolveWith((states) {
                                    if (states.contains(
                                      MaterialState.disabled,
                                    )) {
                                      return const Color(0xFFC5A572);
                                    }
                                    return AppColors.gold;
                                  }),
                            ),
                        onPressed: canSubmit ? _handleFindTime : null,
                        icon: _loading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(LucideIcons.sparkles),
                        label: _loading
                            ? Text(
                                'Finding perfect\nmoments...',
                                textAlign: TextAlign.center,
                                style: textTheme.bodyMedium?.copyWith(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.gold,
                                ),
                              )
                            : Text(
                                'Find Available Times',
                                textAlign: TextAlign.center,
                                style: textTheme.bodyMedium?.copyWith(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.gold,
                                ),
                              ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---------- FORM VIEW ----------
  Widget _buildFormView(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    if (_initialLoading) {
      // simple skeleton placeholders
      return Column(
        children: List.generate(
          5,
          (index) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            height: 68,
            decoration: _sectionDecoration.copyWith(
              color: AppColors.beige.withOpacity(0.6),
            ),
          ),
        ),
      );
    }

    final friend = _friends.where((f) => f.id == _selectedFriendId).firstOrNull;

    final friendLabel = _selectedFriendId == null
        ? 'Choose a friend...'
        : (friend?.displayName() ?? 'Choose a friend...');

    // final friendStatus = _selectedFriendId == null
    //     ? 'No friend selected yet'
    //     : 'Meeting with ${friend?.displayName() ?? 'friend'}';

    final durationLabel =
        {
          '30': '30 minutes',
          '60': '1 hour',
          '90': '1.5 hours',
          '120': '2 hours',
        }[_duration] ??
        '$_duration minutes';

    final meetingTitleLabel = _meetingTitle.isEmpty
        ? 'Tap to add a title'
        : _meetingTitle;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),

        // Section: Participants
        Text(
          'Participants',
          style: textTheme.titleSmall?.copyWith(
            color: AppColors.gold,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),

        _buildSectionTile(
          context: context,
          label: 'Select Friend',
          value: friendLabel,
          onTap: () async {
            final pickedId = await _pickFriend();
            if (pickedId != null) {
              setState(() {
                _selectedFriendId = pickedId;
                _friendError = false;
              });
            }
          },
          leadingIcon: LucideIcons.user,
          required: true,
          hasError: _friendError,
        ),
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          // child: Text(
          //   // friendStatus,
          //   style: textTheme.bodySmall?.copyWith(color: Colors.white70),
          // ),
        ),

        const SizedBox(height: 8),

        // Section: Meeting Details
        Text(
          'Meeting Details',
          style: textTheme.titleSmall?.copyWith(
            color: AppColors.gold,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),

        _buildSectionTile(
          context: context,
          label: 'Meeting Title',
          value: meetingTitleLabel,
          onTap: () async {
            final newTitle = await _pickMeetingTitle();
            if (newTitle != null) {
              setState(() {
                _meetingTitle = newTitle;
                _meetingTitleError = _meetingTitle.trim().isEmpty;
              });
            }
          },
          leadingIcon: LucideIcons.type,
          required: true,
          hasError: _meetingTitleError,
        ),

        const SizedBox(height: 8),

        // Section: Date Range & Duration
        Text(
          'Date Range & Duration',
          style: textTheme.titleSmall?.copyWith(
            color: AppColors.gold,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),

        _buildDateRangeRow(context),

        _buildSectionTile(
          context: context,
          label: 'Meeting Duration',
          value: durationLabel,
          onTap: () async {
            final newDur = await _pickDuration();
            if (newDur != null) {
              setState(() {
                _duration = newDur;
              });
            }
          },
          leadingIcon: LucideIcons.hourglass,
        ),

        const SizedBox(height: 8),

        // Section: Working Hours
        Text(
          'Working Hours',
          style: textTheme.titleSmall?.copyWith(
            color: AppColors.gold,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),

        _buildWorkHoursRow(context),

        const SizedBox(height: 8),

        // Section: Timezone
        Text(
          'Timezone',
          style: textTheme.titleSmall?.copyWith(
            color: AppColors.gold,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),

        _buildSectionTile(
          context: context,
          label: 'Timezone',
          value: _timezone,
          onTap: () async {
            final newTz = await _pickTimezone();
            if (newTz != null && newTz.isNotEmpty) {
              setState(() {
                _timezone = newTz;
              });
            }
          },
          leadingIcon: LucideIcons.globe,
        ),
      ],
    );
  }
}

// Small extension to avoid try/catch for .firstWhere
extension FirstOrNullExtension<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}
