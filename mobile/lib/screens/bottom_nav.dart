import 'package:flutter/material.dart';
import '../theme.dart';
import 'dashboard_screen.dart';
import 'friends_screen.dart';
import 'schedule_screen.dart';
import 'profile_screen.dart';

class BottomNav extends StatefulWidget {
  const BottomNav({super.key});

  @override
  State<BottomNav> createState() => _BottomNavState();
}

class _BottomNavState extends State<BottomNav> {
  int _index = 0;

  final screens = const [
    DashboardScreen(),
    FriendsScreen(),
    ScheduleScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: screens[_index],

      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        selectedItemColor: AppColors.gold,
        unselectedItemColor: AppColors.bronze,
        backgroundColor: AppColors.darkTeal,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            label: "Home",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            label: "Friends",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.access_time),
            label: "Schedule",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: "Profile",
          ),
        ],
      ),
    );
  }
}
