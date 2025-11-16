import 'package:flutter/material.dart';
import '../theme.dart';
import 'dashboard_screen.dart';
import 'friends_screen.dart';
import 'schedule_screen.dart';
import 'settings_screen.dart';

class CardUI extends StatefulWidget {
  const CardUI({super.key});

  @override
  State<CardUI> createState() => _CardUIState();
}

class _CardUIState extends State<CardUI> {
  int _selectedIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  late final List<Widget> _pages;

  void _onNavTap(int index) {
    setState(() => _selectedIndex = index);
  }

  @override
  void initState() {
    super.initState();
    _pages = [
      DashboardScreen(onNavigate: _onNavTap), 
      const FriendsScreen(),
      const ScheduleScreen(),
      const SettingsScreen(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.darkTeal,
      appBar: AppBar(
        backgroundColor: AppColors.darkTeal,
        elevation: 0,
        title: const Text('CAIROS', style: TextStyle(color: AppColors.gold)),
        leading: IconButton(
          icon: const Icon(Icons.menu, color: AppColors.gold),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
      ),
      drawer: Drawer(
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFF1B4B5A), Color(0xFF0F2A34)],
            ),
          ),
          child: SafeArea(child: _buildSidebarContent(isInDrawer: true)),
        ),
      ),
      body: Container(
        color: AppColors.darkTeal,
        width: double.infinity,
        height: double.infinity,
        child: _pages[_selectedIndex],
      ),
    );
  }

  Widget _buildSidebarContent({bool isInDrawer = false}) {
    return Column(
      children: [
        // Logo / Brand
        Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  gradient: const LinearGradient(
                    colors: [Color(0xFFD4AF37), Color(0xFFC5A572)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: const Center(
                  child: Icon(
                    Icons.wb_sunny,
                    color: AppColors.darkTeal,
                    size: 20,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('CAIROS', style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.w600)),
                  SizedBox(height: 4),
                  Text('Find your moment', style: TextStyle(color: Color(0xFFC5A572), fontSize: 12)),
                ],
              )
            ],
          ),
        ),

        // Navigation
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 6.0),
            child: Column(
              children: [
                _navItem(Icons.home, 'Dashboard', 0),
                const SizedBox(height: 6),
                _navItem(Icons.group, 'Your Circle', 1),
                const SizedBox(height: 6),
                _navItem(Icons.calendar_today, 'Find Time', 2),
                const SizedBox(height: 6),
                _navItem(Icons.settings, 'Settings', 3),
              ],
            ),
          ),
        ),

        // Footer motif
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: Color(0xFFD4AF37), width: 0.6)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.wb_sunny, color: const Color(0xFFD4AF37), size: 16),
                  const SizedBox(width: 8),
                  Row(
                    children: List.generate(5, (i) => Container(
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Color(0xFFD4AF37),
                        shape: BoxShape.circle,
                      ),
                    )),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.wb_sunny, color: const Color(0xFFD4AF37), size: 16),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Discover the perfect moments to connect',
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFFC5A572), fontSize: 12),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _navItem(IconData icon, String label, int index) {
    final bool active = _selectedIndex == index;
    return InkWell(
      onTap: () {
        _onNavTap(index);
        // If running inside a Drawer on mobile, close it after navigation
        if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
          Navigator.of(context).pop();
        }
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: active ? const Color(0xFFD4AF37) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Icon(icon, color: active ? AppColors.darkTeal : const Color(0xFFC5A572)),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                color: active ? AppColors.darkTeal : const Color(0xFFC5A572),
                fontWeight: active ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
