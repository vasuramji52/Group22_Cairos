import 'package:flutter/material.dart';
import '../theme.dart';

class TopBanner extends StatelessWidget {
  final String title;
  final String subtitle;
  final EdgeInsetsGeometry? padding;
  final double borderRadius;
  final Widget? icon;

  const TopBanner({
    super.key,
    required this.title,
    required this.subtitle,
    this.icon,
    this.padding = const EdgeInsets.all(8),
    this.borderRadius = 12,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[icon!, const SizedBox(width: 20)],
          Flexible(
            fit: FlexFit.loose,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontSize: 30,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Color(0xFFC5A572),
                    fontSize: 20,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class EgyptianBorder extends StatelessWidget {
  final EdgeInsets? padding;
  final EdgeInsets? margin;

  const EgyptianBorder({super.key, this.padding, this.margin});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Left gradient line
          Flexible(
            fit: FlexFit.loose,
            child: Container(
              height: 1,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [Colors.transparent, AppColors.gold, AppColors.gold],
                ),
              ),
            ),
          ),

          const SizedBox(width: 12),

          // Three diamonds
          Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              3,
              (i) => Container(
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: 6,
                height: 6,
                decoration: const BoxDecoration(color: AppColors.gold),
                transform: Matrix4.rotationZ(0.785398),
              ),
            ),
          ),

          const SizedBox(width: 12),

          // Right gradient line
          Flexible(
            fit: FlexFit.loose,
            child: Container(
              height: 1,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerRight,
                  end: Alignment.centerLeft,
                  colors: [Colors.transparent, AppColors.gold, AppColors.gold],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class PapyrusCard extends StatelessWidget {
  final Widget child;
  final Widget? icon;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  const PapyrusCard({
    super.key,
    required this.child,
    this.icon,
    this.padding,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity, // takes as much width as parent
      margin: margin ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.beige.withOpacity(0.95),
        borderRadius: BorderRadius.circular(16),

        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.18),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Container(
        color: Colors.white.withOpacity(0.0),
        padding: padding ?? const EdgeInsets.all(16),
        child: _buildContent(),
      ),
    );
  }

  Widget _buildContent() {
    // If icon exists, align it next to the first line of the child content.
    if (icon != null && child is Column) {
      final column = child as Column;
      final heading = column.children.isNotEmpty ? column.children.first : null;
      final remaining = column.children.skip(1).toList();

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (heading != null)
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                icon!,
                const SizedBox(width: 8),
                Expanded(child: heading),
              ],
            ),
          ...remaining,
        ],
      );
    }

    return child; // if no icon or not a Column
  }
}
