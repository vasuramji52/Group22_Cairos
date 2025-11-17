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

  String _date = ''; // yyyy-MM-dd
  String _duration = '60';

  String _workStart = '09:00'; // HH:mm
  String _workEnd = '17:00'; // HH:mm
  String _timezone = 'America/New_York';

  bool _loading = false;
  bool _initialLoading = true; // for skeleton while loading

  // validation flags for required fields
  bool _friendError = false;
  bool _dateError = false;

  String? _currentUserId;
  final List<SuggestionSlot> _suggestions = [];

  @override
  void initState() {
    super.initState();
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    _date = _formatDateForInput(tomorrow);
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
    final baseLabelStyle = Theme.of(context).textTheme.labelMedium?.copyWith(
      color: hasError ? Colors.red[700] : Colors.black54,
    );

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        child: Row(
          children: [
            if (leadingIcon != null) ...[
              Icon(leadingIcon, size: 20, color: Colors.black54),
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
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  if (hasError)
                    Padding(
                      padding: const EdgeInsets.only(top: 2.0),
                      child: Text(
                        'This field is required',
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(color: Colors.red[700]),
                      ),
                    ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right),
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

  // special row layout for A4: work start/end side by side
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

  // ---------- MODALS ----------

  Future<String?> _pickFriend() async {
    return showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
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
                      style: Theme.of(ctx).textTheme.bodyMedium,
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
                  style: Theme.of(ctx).textTheme.titleMedium,
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
                            style: const TextStyle(
                              color: Colors.black87,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        title: Text(f.displayName()),
                        subtitle: f.email != null ? Text(f.email!) : null,
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
                  style: Theme.of(ctx).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: CupertinoPicker(
                    scrollController: controller,
                    itemExtent: 32,
                    onSelectedItemChanged: (index) {
                      selectedIndex = index;
                    },
                    children: options
                        .map((opt) => Center(child: Text(opt['label']!)))
                        .toList(),
                  ),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: Padding(
                    padding: const EdgeInsets.only(right: 16.0),
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1B4B5A),
                        foregroundColor: AppColors.gold,
                      ),
                      onPressed: () {
                        Navigator.of(ctx).pop(options[selectedIndex]['value']!);
                      },
                      child: const Text('Done'),
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
                  Text('Timezone', style: Theme.of(ctx).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  TextField(
                    controller: controller,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      labelText: 'IANA Timezone (e.g. America/New_York)',
                    ),
                  ),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerRight,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1B4B5A),
                        foregroundColor: AppColors.gold,
                      ),
                      onPressed: () {
                        Navigator.of(ctx).pop(controller.text.trim());
                      },
                      child: const Text('Save'),
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
        return SafeArea(
          child: Container(
            decoration: _modalDecoration(),
            padding: const EdgeInsets.only(top: 12, bottom: 16),
            height: 260,
            child: Column(
              children: [
                _buildHandleBar(),
                const SizedBox(height: 8),
                Text('Select Time', style: Theme.of(ctx).textTheme.titleMedium),
                const SizedBox(height: 8),
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Hours
                      Expanded(
                        child: CupertinoPicker(
                          scrollController: hourController,
                          itemExtent: 32,
                          onSelectedItemChanged: (index) {
                            selectedHour12 = index + 1;
                          },
                          children: List.generate(
                            12,
                            (i) => Center(child: Text('${i + 1}')),
                          ),
                        ),
                      ),
                      const Text(':'),
                      // Minutes
                      Expanded(
                        child: CupertinoPicker(
                          scrollController: minuteController,
                          itemExtent: 32,
                          onSelectedItemChanged: (index) {
                            selectedMinute = index;
                          },
                          children: List.generate(
                            60,
                            (i) => Center(
                              child: Text(i.toString().padLeft(2, '0')),
                            ),
                          ),
                        ),
                      ),
                      // AM/PM
                      Expanded(
                        child: CupertinoPicker(
                          scrollController: periodController,
                          itemExtent: 32,
                          onSelectedItemChanged: (index) {
                            selectedPeriodIndex = index;
                          },
                          children: const [
                            Center(child: Text('AM')),
                            Center(child: Text('PM')),
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
                        backgroundColor: const Color(0xFF1B4B5A),
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
                      child: const Text('Done'),
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

  // ---------- BEST-TIME MODAL ----------
  Future<void> _showBestTimeModal(SuggestionSlot slot) async {
    FriendDto? selectedFriend;
    if (_selectedFriendId != null) {
      try {
        selectedFriend = _friends.firstWhere((f) => f.id == _selectedFriendId);
      } catch (_) {
        selectedFriend = null;
      }
    }

    final startLabel = _formatTimeLabel(context, slot.startIso);
    final endLabel = _formatTimeLabel(context, slot.endIso);
    final dateLabel = _formatDateLabel(slot.startIso);
    final friendName = selectedFriend?.displayName() ?? 'Friend';
    final friendInitialChar = _friendInitial(selectedFriend);
    final isSmall = MediaQuery.of(context).size.width < 380;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: false,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Container(
            decoration: _modalDecoration(),
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              height: 260, // ← make the sheet taller
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(child: _buildHandleBar()),
                  const SizedBox(height: 12),

                  // header: person + date
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
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
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Meeting with $friendName',
                              style: Theme.of(ctx).textTheme.bodyMedium
                                  ?.copyWith(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              dateLabel,
                              style: Theme.of(ctx).textTheme.bodySmall
                                  ?.copyWith(
                                    color: Colors.black54,
                                    fontSize: isSmall ? 15 : 16,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // time row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(LucideIcons.clock, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '$startLabel - $endLabel',
                              style: Theme.of(ctx).textTheme.bodyMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    fontSize: isSmall ? 13 : 14,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$_duration minute meeting • $_timezone',
                              style: Theme.of(ctx).textTheme.bodySmall
                                  ?.copyWith(
                                    color: Colors.black54,
                                    fontSize: isSmall ? 13 : 14,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const Spacer(),

                  Align(
                    alignment: Alignment.centerRight,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1B4B5A),
                        foregroundColor: AppColors.gold,
                      ),
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('Close'),
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

  // ---------- ACTION: find time ----------
  Future<void> _handleFindTime() async {
    // light haptic on CTA press
    HapticFeedback.lightImpact();

    bool missingFriend =
        _selectedFriendId == null || _selectedFriendId!.isEmpty;
    bool missingDate = _date.isEmpty;

    if (missingFriend || missingDate) {
      setState(() {
        _friendError = missingFriend;
        _dateError = missingDate;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all required fields')),
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

    const apiStartTime = '00:00';
    const apiEndTime = '23:59';
    final durationMinutes = int.tryParse(_duration) ?? 30;

    try {
      // Build the same ISO range as in React
      final startLocal = DateTime.parse('${_date}T$apiStartTime:00');
      final endLocal = DateTime.parse('${_date}T$apiEndTime:00');
      final startIso = startLocal.toUtc().toIso8601String();
      final endIso = endLocal.toUtc().toIso8601String();

      final workStartHour = int.tryParse(_workStart.split(':').first) ?? 9;
      final workEndHour = int.tryParse(_workEnd.split(':').first) ?? 17;

      final queryParams = {
        'userA': _currentUserId!,
        'userB': _selectedFriendId!,
        'minutes': durationMinutes.toString(),
        'start': startIso,
        'end': endIso,
        'tz': _timezone,
        'workStart': workStartHour.toString(),
        'workEnd': workEndHour.toString(),
      };

      final queryString = Uri(queryParameters: queryParams).query;

      final res = await ApiService.api(
        '/availability/first?$queryString',
        method: 'GET',
      );

      if (!mounted) return;

      if (res.statusCode != 200) {
        final text = res.body;
        throw Exception(text.isNotEmpty ? text : 'Request failed');
      }

      final data = json.decode(res.body) as Map<String, dynamic>;

      // Handle "no_slot"
      if (data['ok'] == false && data['error'] == 'no_slot') {
        setState(() {
          _suggestions.clear();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No available times found in this window'),
          ),
        );
        HapticFeedback.mediumImpact();
        return;
      }

      // Other error
      if (data['error'] != null && data['error'] != 'no_slot') {
        throw Exception(data['error'].toString());
      }

      // Normalize shapes like in React:
      // slot, firstSlot, slotStart/slotEnd, slots[0]
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

      if (first != null &&
          first['start'] != null &&
          first['end'] != null &&
          first['start'].toString().isNotEmpty &&
          first['end'].toString().isNotEmpty) {
        final slot = SuggestionSlot(
          startIso: first['start'].toString(),
          endIso: first['end'].toString(),
        );

        setState(() {
          _suggestions
            ..clear()
            ..add(slot);
        });

        HapticFeedback.lightImpact();

        // show modal with best time
        await _showBestTimeModal(slot);
      } else {
        setState(() {
          _suggestions.clear();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No available times found in this window'),
          ),
        );
        HapticFeedback.mediumImpact();
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
    final bool canSubmit = !_loading && _selectedFriendId != null;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1B4B5A), Color(0xFF2C6E7E)],
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
                        children: const [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Find the Perfect Time',
                                  style: TextStyle(
                                    color: AppColors.gold,
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'Combine schedules to discover your Kairos',
                                  style: TextStyle(color: AppColors.bronze),
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
                              backgroundColor: const Color(0xFF1B4B5A),
                              foregroundColor: AppColors.gold,
                              elevation: 0, // shadow handled by DecoratedBox
                            ).copyWith(
                              backgroundColor:
                                  MaterialStateProperty.resolveWith((states) {
                                    if (states.contains(
                                      MaterialState.disabled,
                                    )) {
                                      return const Color(0xFF2C6E7E);
                                    }
                                    return const Color(0xFF1B4B5A);
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
                            ? const Text(
                                'Finding perfect\nmoments...',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              )
                            : const Text(
                                'Find Available Times',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
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
    if (_initialLoading) {
      // simple skeleton placeholders
      return Column(
        children: List.generate(
          4,
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

    final friendStatus = _selectedFriendId == null
        ? 'No friend selected yet'
        : 'Meeting with ${friend?.displayName() ?? 'friend'}';

    final durationLabel =
        {
          '30': '30 minutes',
          '60': '1 hour',
          '90': '1.5 hours',
          '120': '2 hours',
        }[_duration] ??
        '$_duration minutes';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),

        // Section: Participants
        Text(
          'Participants',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: Colors.white,
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
          child: Text(
            friendStatus,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: Colors.white70),
          ),
        ),

        const SizedBox(height: 8),

        // Section: Date & Duration
        Text(
          'Date & Duration',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),

        _buildSectionTile(
          context: context,
          label: 'Date',
          value: _date.isEmpty ? 'Select date' : _formatDateLabel(_date),
          onTap: () async {
            final initialDate =
                DateTime.tryParse('${_date}T00:00:00') ??
                DateTime.now().add(const Duration(days: 1));
            final picked = await showDatePicker(
              context: context,
              initialDate: initialDate,
              firstDate: DateTime.now(),
              lastDate: DateTime.now().add(const Duration(days: 365)),
            );
            if (picked != null) {
              setState(() {
                _date = _formatDateForInput(picked);
                _dateError = false;
              });
            }
          },
          leadingIcon: LucideIcons.calendarDays,
          required: true,
          hasError: _dateError,
        ),

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
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),

        _buildWorkHoursRow(context),

        const SizedBox(height: 8),

        // Section: Timezone
        Text(
          'Timezone',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: Colors.white,
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
