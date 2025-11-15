import 'package:flutter/material.dart';
import '../theme.dart';

class FriendsScreen extends StatelessWidget {
  const FriendsScreen({super.key});

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
                "Your Circle",
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Text(
                "Manage your companions",
                style: TextStyle(color: AppColors.bronze),
              ),

              const SizedBox(height: 20),

              TextField(
                decoration: InputDecoration(
                  hintText: "Add friend by email",
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.9),
                  border: const OutlineInputBorder(),
                ),
              ),

              const SizedBox(height: 12),

              Expanded(
                child: ListView.builder(
                  itemCount: 3,
                  itemBuilder: (context, i) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.85),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.gold, width: 2),
                      ),
                      child: Row(
                        children: const [
                          CircleAvatar(
                            radius: 22,
                            backgroundColor: AppColors.bronze,
                            child: Text("A"),
                          ),
                          SizedBox(width: 14),
                          Text(
                            "friend@email.com",
                            style: TextStyle(
                              color: AppColors.darkTeal,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
