// lib/screens/schedule_screen.dart
import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../theme.dart';
import '../styles/card_ui_styles.dart'; // 👈 ADD THIS BACK
import '../services/api_service.dart';
import '../services/friends_api.dart';

/// ---------- MODELS (top level!) ----------

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

/// ---------- SCREEN WIDGET ----------

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
  String _workEnd = '17:00';   // HH:mm
  String _timezone = 'America/New_York';

  bool _loading = false;
  bool _showSuggestions = false;

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
    return MaterialLocalizations.of(context)
        .formatTimeOfDay(tod, alwaysUse24HourFormat: false);
  }

  // ---------- MODAL HELPERS ----------

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

  Widget _buildSectionTile({
    required BuildContext context,
    required String label,
    required String value,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: _sectionDecoration,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color: Colors.black54,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      value,
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }

  Future<String?> _pickFriend() async {
    return showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        if (_friends.isEmpty) {
          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              height: 120,
              child: Center(
                child: Text(
                  'No friends yet',
                  style: Theme.of(ctx).textTheme.bodyMedium,
                ),
              ),
            ),
          );
        }

        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[400],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
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
                      title: Text(f.displayName()),
                      subtitle: f.email != null ? Text(f.email!) : null,
                      onTap: () => Navigator.of(context).pop(f.id),
                    );
                  },
                ),
              ),
            ],
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

    return showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[400],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Meeting Duration',
                style: Theme.of(ctx).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              ...options.map((opt) {
                return ListTile(
                  title: Text(opt['label']!),
                  onTap: () => Navigator.of(ctx).pop(opt['value']),
                );
              }).toList(),
            ],
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
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[400],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Timezone',
                    style: Theme.of(ctx).textTheme.titleMedium,
                  ),
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

    final hourController =
        FixedExtentScrollController(initialItem: selectedHour12 - 1);
    final minuteController =
        FixedExtentScrollController(initialItem: selectedMinute);
    final periodController =
        FixedExtentScrollController(initialItem: selectedPeriodIndex);

    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Container(
            padding: const EdgeInsets.only(top: 12, bottom: 16),
            height: 260,
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[400],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Select Time',
                  style: Theme.of(ctx).textTheme.titleMedium,
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

  // ---------- ACTION: find time ----------
  Future<void> _handleFindTime() async {
    if (_selectedFriendId == null ||
        _selectedFriendId!.isEmpty ||
        _date.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all fields')),
      );
      return;
    }

    if (_currentUserId == null || _currentUserId!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You must be logged in before finding a time.'),
        ),
      );
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
          _showSuggestions = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No available times found in this window'),
          ),
        );
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
        setState(() {
          _suggestions
            ..clear()
            ..add(
              SuggestionSlot(
                startIso: first!['start'].toString(),
                endIso: first['end'].toString(),
              ),
            );
          _showSuggestions = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Found an available time!')),
        );
      } else {
        setState(() {
          _suggestions.clear();
          _showSuggestions = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No available times found in this window'),
          ),
        );
      }
    } catch (e) {
      debugPrint('availability error: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
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
    FriendDto? selectedFriend;
    if (_selectedFriendId != null) {
      try {
        selectedFriend = _friends.firstWhere((f) => f.id == _selectedFriendId);
      } catch (_) {
        selectedFriend = null;
      }
    }

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TopBanner(
              title: 'Find the Perfect Time',
              subtitle: 'Combine schedules to discover your Kairos',
              icon: const Icon(
                LucideIcons.clock,
                color: AppColors.gold,
                size: 50,
              ),
            ),
            const SizedBox(height: 24),
            const EgyptianBorder(),
            const SizedBox(height: 16),
            _showSuggestions
                ? _buildSuggestionsView(context, selectedFriend)
                : _buildFormView(context),
          ],
        ),
      ),
    );
  }

  // ---------- FORM VIEW ----------
  Widget _buildFormView(BuildContext context) {
    final friendLabel = _selectedFriendId == null
        ? 'Choose a friend...'
        : (_friends
                .where((f) => f.id == _selectedFriendId)
                .map((f) => f.displayName())
                .firstOrNull ??
            'Choose a friend...');

    final durationLabel = {
          '30': '30 minutes',
          '60': '1 hour',
          '90': '1.5 hours',
          '120': '2 hours',
        }[_duration] ??
        '$_duration minutes';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),

        // Friend
        _buildSectionTile(
          context: context,
          label: 'Select Friend',
          value: friendLabel,
          onTap: () async {
            final pickedId = await _pickFriend();
            if (pickedId != null) {
              setState(() {
                _selectedFriendId = pickedId;
              });
            }
          },
        ),

        // Date
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
              });
            }
          },
        ),

        // Duration
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
        ),

        // Work Start
        _buildSectionTile(
          context: context,
          label: 'Work Start Time',
          value: _formatHmLabel(context, _workStart),
          onTap: () async {
            final newHm = await _pickTime(_workStart);
            if (newHm != null) {
              setState(() {
                _workStart = newHm;
              });
            }
          },
        ),

        // Work End
        _buildSectionTile(
          context: context,
          label: 'Work End Time',
          value: _formatHmLabel(context, _workEnd),
          onTap: () async {
            final newHm = await _pickTime(_workEnd);
            if (newHm != null) {
              setState(() {
                _workEnd = newHm;
              });
            }
          },
        ),

        // Timezone
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
        ),

        const SizedBox(height: 20),

        // Submit
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1B4B5A),
              foregroundColor: AppColors.gold,
              side: BorderSide(
                color: AppColors.gold,
                width: 2,
              ),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            onPressed:
                _loading || _selectedFriendId == null ? null : _handleFindTime,
            icon: _loading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(LucideIcons.sparkles),
            label: Text(
              _loading
                  ? 'Finding perfect moments...'
                  : 'Find Available Times',
            ),
          ),
        ),
      ],
    );
  }

  // ---------- SUGGESTIONS VIEW ----------
  Widget _buildSuggestionsView(
    BuildContext context,
    FriendDto? selectedFriend,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Meeting summary card (no papyrus, beige card)
        Container(
          decoration: _sectionDecoration,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                // Avatar
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [AppColors.gold, AppColors.gold.withOpacity(0.7)],
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    _friendInitial(selectedFriend),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Meeting with ${selectedFriend?.displayName() ?? 'Friend'}',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _suggestions.isNotEmpty
                            ? _formatDateLabel(_suggestions.first.startIso)
                            : _formatDateLabel(_date),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _showSuggestions = false;
                    });
                  },
                  child: const Text('Change Details'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Slots
        Text(
          'Available Time Slots (${_suggestions.length})',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),

        if (_suggestions.isNotEmpty)
          Column(
            children: List.generate(_suggestions.length, (index) {
              final s = _suggestions[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: Container(
                  decoration: _sectionDecoration,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            gradient: LinearGradient(
                              colors: [
                                AppColors.gold,
                                AppColors.gold.withOpacity(0.7),
                              ],
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text(
                                'Slot',
                                style: TextStyle(fontSize: 10),
                              ),
                              Text('${index + 1}'),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${_formatTimeLabel(context, s.startIso)} - '
                                '${_formatTimeLabel(context, s.endIso)}',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '$_duration minute meeting',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),

        if (_suggestions.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 12.0),
            child: Container(
              decoration: _sectionDecoration,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  vertical: 32.0,
                  horizontal: 16.0,
                ),
                child: Column(
                  children: [
                    const Icon(LucideIcons.clock, size: 40),
                    const SizedBox(height: 8),
                    Text(
                      'No available times found',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Try adjusting your time window or selecting a different date',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

// Small extension to avoid try/catch for .firstWhere
extension FirstOrNullExtension<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}

