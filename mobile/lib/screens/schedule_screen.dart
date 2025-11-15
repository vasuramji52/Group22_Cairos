import 'package:flutter/material.dart';
import '../theme.dart';

class ScheduleScreen extends StatelessWidget {
  const ScheduleScreen({super.key});

  final List<Map<String, String>> schedule = const [
    {'day': 'Monday', 'time': '2:00 PM', 'title': 'Team Standup'},
    {'day': 'Wednesday', 'time': '10:00 AM', 'title': 'Project Review'},
    {'day': 'Friday', 'time': '3:30 PM', 'title': 'Client Call'},
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.accentTeal, AppColors.darkTeal],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Find Time',
                    style: TextStyle(
                      color: AppColors.gold,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Schedule and manage your availability',
                    style: TextStyle(
                      color: Color(0xFFC5A572),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Schedule a Meeting Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add),
                label: const Text('Schedule Meeting'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentTeal,
                  foregroundColor: AppColors.gold,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Upcoming Schedule
            const Text(
              'Upcoming Schedule',
              style: TextStyle(
                color: AppColors.darkTeal,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...schedule.map((event) => _scheduleCard(event)),

            const SizedBox(height: 24),

            // Availability
            const Text(
              'Your Availability',
              style: TextStyle(
                color: AppColors.darkTeal,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _availabilityCard('Monday - Friday', '9:00 AM - 5:00 PM'),
            const SizedBox(height: 8),
            _availabilityCard('Saturday', 'Not Available'),
          ],
        ),
      ),
    );
  }

  Widget _scheduleCard(Map<String, String> event) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.gold, width: 0.8),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: AppColors.accentTeal,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.event, color: AppColors.gold),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event['title']!,
                  style: const TextStyle(
                    color: AppColors.darkTeal,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '${event['day']} at ${event['time']}',
                  style: const TextStyle(
                    color: AppColors.darkTeal,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.edit, color: AppColors.accentTeal),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _availabilityCard(String days, String hours) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.gold, width: 0.8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                days,
                style: const TextStyle(
                  color: AppColors.darkTeal,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                hours,
                style: const TextStyle(
                  color: AppColors.darkTeal,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          Icon(
            Icons.check_circle,
            color: hours == 'Not Available' ? Colors.grey : Colors.green,
          ),
        ],
      ),
    );
  }
}
