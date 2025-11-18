import 'package:flutter/material.dart';
import '../theme.dart';
import 'dashboard_screen.dart';
import 'friends_screen.dart';
import 'schedule_screen.dart';
import 'settings_screen.dart';

class BottomNav extends StatefulWidget {
  const BottomNav({super.key});

  @override
  State<BottomNav> createState() => _BottomNavState();
}

class _BottomNavState extends State<BottomNav> {
  int _index = 0;
  
  void _onNavTap(int index) {
    setState(() => _index = index);
  }

  late final List<Widget> screens;

  @override
  void initState() {
    super.initState();
    screens = [
      DashboardScreen(onNavigate: _onNavTap),
      const FriendsScreen(),
      const ScheduleScreen(),
      const SettingsScreen(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [AppColors.darkTeal, AppColors.accentTeal],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: screens[_index],
      ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: AppColors.darkTeal,
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        selectedItemColor: AppColors.gold,
        unselectedItemColor: AppColors.bronze,
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
