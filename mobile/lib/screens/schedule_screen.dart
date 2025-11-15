import 'package:flutter/material.dart';
import '../theme.dart';

class ScheduleScreen extends StatelessWidget {
  const ScheduleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkTeal,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Find the Perfect Time",
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Text(
                "Combine schedules to discover your Kairos",
                style: TextStyle(color: AppColors.bronze),
              ),

              const SizedBox(height: 20),

              TextField(
                decoration: InputDecoration(
                  hintText: "Select friend...",
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.9),
                  border: const OutlineInputBorder(),
                ),
              ),

              const SizedBox(height: 12),

              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentTeal,
                  foregroundColor: AppColors.gold,
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: const Text("Find Available Times"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
