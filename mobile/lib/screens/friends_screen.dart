import 'package:flutter/material.dart';
import '../theme.dart';

class FriendsScreen extends StatelessWidget {
  const FriendsScreen({super.key});

  final List<Map<String, String>> friends = const [
    {'name': 'Alice Johnson', 'status': 'Online'},
    {'name': 'Bob Smith', 'status': 'Away'},
    {'name': 'Charlie Davis', 'status': 'Online'},
    {'name': 'Diana Wilson', 'status': 'Online'},
    {'name': 'Eve Martinez', 'status': 'Offline'},
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
                    'Your Circle',
                    style: TextStyle(
                      color: AppColors.gold,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Stay connected with your network',
                    style: TextStyle(
                      color: Color(0xFFC5A572),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Add Friend Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.person_add),
                label: const Text('Add Friend'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentTeal,
                  foregroundColor: AppColors.gold,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Friends List
            const Text(
              'Friends (${5})',
              style: TextStyle(
                color: AppColors.darkTeal,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...friends.map((friend) => _friendCard(friend)),
          ],
        ),
      ),
    );
  }

  Widget _friendCard(Map<String, String> friend) {
    final isOnline = friend['status'] == 'Online';
    final statusColor = isOnline ? Colors.green : Colors.grey;

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
          CircleAvatar(
            backgroundColor: AppColors.accentTeal,
            child: Text(
              friend['name']!.split(' ')[0][0],
              style: const TextStyle(color: Colors.white),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  friend['name']!,
                  style: const TextStyle(
                    color: AppColors.darkTeal,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Row(
                  children: [
                    CircleAvatar(
                      radius: 4,
                      backgroundColor: statusColor,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      friend['status']!,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.message, color: AppColors.accentTeal),
            onPressed: () {},
          ),
        ],
      ),
    );
  }
}
