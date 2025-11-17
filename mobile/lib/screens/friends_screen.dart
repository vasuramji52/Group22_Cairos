import 'dart:convert';

import 'package:flutter/material.dart';
import '../theme.dart';
import '../styles/card_ui_styles.dart';
import '../services/friends_api.dart'; // contains FriendsApi + UIFriend
import '../models/ui_friend.dart';
import '../models/user.dart';

class FriendsScreen extends StatefulWidget {
  const FriendsScreen({super.key});

  @override
  State<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends State<FriendsScreen> {
  final TextEditingController _addController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _searchFocusNode = FocusNode();

  List<UIFriend> _friends = [];
  List<UIFriend> _incoming = [];
  List<UIFriend> _outgoing = [];

  bool _loading = true;
  bool _adding = false;
  bool _animateList = false;
  bool _isSearchFocused = false;

  @override
  void initState() {
    super.initState();
    _loadFriends();

    // Animate list in slightly after first build
    Future.delayed(const Duration(milliseconds: 120), () {
      if (mounted) {
        setState(() => _animateList = true);
      }
    });

    _searchFocusNode.addListener(() {
      if (!mounted) return;
      setState(() {
        _isSearchFocused = _searchFocusNode.hasFocus;
      });
    });
  }

  @override
  void dispose() {
    _addController.dispose();
    _searchController.dispose();
    _scrollController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  Future<void> _loadFriends() async {
    setState(() => _loading = true);
    try {
      final data = await FriendsApi.getFriends();
      final friendsJson = (data['friends'] as List?) ?? [];
      final incomingJson = (data['receivedRequests'] as List?) ?? [];
      final outgoingJson = (data['sentRequests'] as List?) ?? [];

      setState(() {
        _friends = friendsJson.map((j) => UIFriend.fromJson(j)).toList();
        _incoming = incomingJson.map((j) => UIFriend.fromJson(j)).toList();
        _outgoing = outgoingJson.map((j) => UIFriend.fromJson(j)).toList();
      });
    } catch (e) {
      _showSnack('Failed to load friends. Please try again.', isError: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<UIFriend> get _filteredFriends {
    final q = _searchController.text.trim().toLowerCase();
    if (q.isEmpty) return _friends;
    return _friends.where((f) {
      final full = '${f.nickname} ${f.firstName} ${f.lastName} ${f.email}'
          .toLowerCase();
      return full.contains(q);
    }).toList();
  }

  void _showSnack(String msg, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? Colors.red[700] : Colors.green[700],
      ),
    );
  }

  Future<void> _handleAddFriend([String? emailOverride]) async {
    final email = (emailOverride ?? _addController.text).trim();
    if (email.isEmpty) return;

    setState(() => _adding = true);
    try {
      final res = await FriendsApi.addFriend(email);
      if (res['error'] != null) {
        _showSnack(res['error'].toString(), isError: true);
      } else {
        _showSnack('Friend request sent!');
        _addController.clear();
        await _loadFriends();
      }
    } catch (e) {
      _showSnack('Failed to add friend', isError: true);
    } finally {
      if (mounted) setState(() => _adding = false);
    }
  }

  Future<void> _handleAccept(String requesterId) async {
    try {
      final res = await FriendsApi.acceptFriend(requesterId);
      if (res['error'] != null) {
        _showSnack(res['error'].toString(), isError: true);
      } else {
        _showSnack('Friend request accepted');
        await _loadFriends();
      }
    } catch (e) {
      _showSnack('Failed to accept request', isError: true);
    }
  }

  Future<void> _handleDecline(String requesterId) async {
    try {
      final res = await FriendsApi.declineFriend(requesterId);
      if (res['error'] != null) {
        _showSnack(res['error'].toString(), isError: true);
      } else {
        _showSnack('Friend request declined');
        await _loadFriends();
      }
    } catch (e) {
      _showSnack('Failed to decline request', isError: true);
    }
  }

  Future<void> _handleRemoveFriend(UIFriend friend) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.beige,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: const BorderSide(color: AppColors.gold),
        ),
        title: const Text(
          'Remove friend?',
          style: TextStyle(color: AppColors.darkTeal),
        ),
        content: Text(
          'Remove ${friend.nickname} from your circle? This cannot be undone.',
          style: const TextStyle(color: AppColors.accentTeal),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppColors.accentTeal),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFC1440E),
            ),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      final res = await FriendsApi.removeFriend(friend.email);
      if (res['error'] != null) {
        _showSnack(res['error'].toString(), isError: true);
      } else {
        _showSnack('Friend removed');
        await _loadFriends();
      }
    } catch (e) {
      _showSnack('Failed to remove friend', isError: true);
    }
  }

  void _showAddFriendSheet() {
    final sheetController = TextEditingController();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.beige,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        bool localLoading = false;

        return StatefulBuilder(
          builder: (context, setModalState) => Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Add New Friend',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.darkTeal,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Add friends by their email address (they must have a Cairos account and be verified).',
                  style: TextStyle(color: AppColors.accentTeal),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: sheetController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    hintText: 'friend@gmail.com',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: AppColors.gold),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: localLoading
                        ? null
                        : () async {
                            final email = sheetController.text.trim();
                            if (email.isEmpty) return;
                            setModalState(() => localLoading = true);
                            await _handleAddFriend(email);
                            if (mounted) Navigator.pop(context);
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.darkTeal,
                    ),
                    child: Text(
                      localLoading ? 'Sending...' : 'Send Request',
                      style: const TextStyle(color: AppColors.gold),
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

  void _openPendingPanel() {
    // If nothing pending, just show a snack and don’t open a blank panel
    if (_incoming.isEmpty) {
      _showSnack('No pending requests right now.');
      return;
    }

    showGeneralDialog(
      context: context,
      barrierLabel: 'Pending requests',
      barrierDismissible: true,
      barrierColor: Colors.black54,
      transitionDuration: const Duration(milliseconds: 280),
      pageBuilder: (ctx, animation, secondaryAnimation) {
        return Align(
          alignment: Alignment.centerRight,
          child: Material(
            color: Colors.transparent,
            child: Container(
              width: MediaQuery.of(ctx).size.width,
              height: MediaQuery.of(ctx).size.height,
              color: AppColors.darkTeal,
              child: SafeArea(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top bar
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            icon: const Icon(
                              Icons.arrow_back_ios_new,
                              color: AppColors.gold,
                            ),
                            onPressed: () => Navigator.of(ctx).pop(),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Pending Requests',
                            style: TextStyle(
                              color: AppColors.gold,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const Spacer(),
                          const Icon(
                            Icons.inbox_outlined,
                            color: AppColors.gold,
                          ),
                        ],
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'Accept or decline friend requests awaiting your response.',
                        style: TextStyle(color: AppColors.bronze, fontSize: 12),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _incoming.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (ctx, index) {
                          final f = _incoming[index];
                          return _PendingRequestTile(
                            friend: f,
                            onAccept: () => _handleAccept(f.id),
                            onDecline: () => _handleDecline(f.id),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
      transitionBuilder: (ctx, anim, secondaryAnim, child) {
        final offsetAnimation = Tween<Offset>(
          begin: const Offset(1.0, 0.0), // slide in from right
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOutCubic));

        return SlideTransition(position: offsetAnimation, child: child);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredFriends;

    return Scaffold(
      backgroundColor: AppColors.darkTeal,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddFriendSheet,
        backgroundColor: AppColors.gold,
        icon: const Icon(Icons.person_add_alt_1, color: AppColors.darkTeal),
        label: const Text(
          'Add Friend',
          style: TextStyle(color: AppColors.darkTeal),
        ),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.gold,
          backgroundColor: AppColors.darkTeal,
          onRefresh: _loadFriends,
          child: ListView(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            children: [
              Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 600),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header row with inbox icon + badge
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text(
                                  'Your Circle',
                                  style: TextStyle(
                                    color: AppColors.gold,
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'Manage your companions and connections',
                                  style: TextStyle(color: AppColors.bronze),
                                ),
                              ],
                            ),
                          ),
                          Stack(
                            clipBehavior: Clip.none,
                            children: [
                              IconButton(
                                icon: const Icon(
                                  Icons.inbox_outlined,
                                  size: 28,
                                  color: AppColors.gold,
                                ),
                                tooltip: 'View pending requests',
                                onPressed: _openPendingPanel,
                              ),
                              if (_incoming.isNotEmpty)
                                Positioned(
                                  right: 4,
                                  top: 4,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.gold,
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: AppColors.darkTeal,
                                        width: 1.3,
                                      ),
                                    ),
                                    child: Text(
                                      _incoming.length.toString(),
                                      style: const TextStyle(
                                        color: AppColors.darkTeal,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),
                      const EgyptianBorder(),
                      const SizedBox(height: 16),

                      // Transparent-on-idle search bar on dark teal
                      _buildSearchBar(),

                      const SizedBox(height: 16),

                      // Friends list directly on blue background (no big card)
                      _buildFriendsList(filtered),

                      const SizedBox(height: 80), // space for FAB
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Search bar: transparent until focused; when focused → gold outline + soft glow (Style 1)
  Widget _buildSearchBar() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOut,
      decoration: BoxDecoration(
        color: _isSearchFocused
            ? Colors.white.withOpacity(0.06)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: _isSearchFocused ? AppColors.gold : Colors.transparent,
          width: 1.3,
        ),
        boxShadow: _isSearchFocused
            ? [
                BoxShadow(
                  color: AppColors.gold.withOpacity(0.35),
                  blurRadius: 10,
                  spreadRadius: 0.5,
                  offset: const Offset(0, 2),
                ),
              ]
            : [],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      child: Row(
        children: [
          const Icon(Icons.search, color: AppColors.accentTeal),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              focusNode: _searchFocusNode,
              controller: _searchController,
              onChanged: (_) => setState(() {}),
              style: const TextStyle(color: AppColors.beige),
              decoration: const InputDecoration(
                hintText: 'Search friends...',
                hintStyle: TextStyle(color: AppColors.bronze),
                border: InputBorder.none,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Friends list: each friend is a clean rounded card with a papyrus-like background,
  /// stacked on the dark teal background (no big outer card).
  Widget _buildFriendsList(List<UIFriend> filtered) {
    if (_loading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 24),
          child: CircularProgressIndicator(color: AppColors.beige),
        ),
      );
    }

    if (filtered.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            AnkhIcon(size: 40, color: AppColors.gold),
            SizedBox(height: 12),
            Text(
              'No friends yet',
              style: TextStyle(color: AppColors.beige, fontSize: 14),
            ),
            SizedBox(height: 4),
            Text(
              'Add friends by their email address to start finding the perfect time to meet.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.bronze, fontSize: 12),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (int i = 0; i < filtered.length; i++)
          _AnimatedFriendRow(
            index: i,
            animate: _animateList,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
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
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: AppColors.gold,
                      child: Text(
                        filtered[i].nickname.isNotEmpty
                            ? filtered[i].nickname[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                          color: AppColors.darkTeal,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            filtered[i].nickname,
                            style: const TextStyle(
                              color: AppColors.darkTeal,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          // if (filtered[i].firstName.isNotEmpty ||
                          //     filtered[i].lastName.isNotEmpty)
                          //   Text(
                          //     '${filtered[i].firstName} ${filtered[i].lastName}'
                          //         .trim(),
                          //     style: const TextStyle(
                          //       color: AppColors.accentTeal,
                          //       fontSize: 12,
                          //     ),
                          //   ),
                          Text(
                            filtered[i].email,
                            style: const TextStyle(
                              color: AppColors.bronze,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => _handleRemoveFriend(filtered[i]),
                      icon: const Icon(
                        Icons.delete_outline,
                        color: Color(0xFFC1440E),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

        // Summary
        if (_searchController.text.trim().isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Center(
              child: Text(
                '${_friends.length} ${_friends.length == 1 ? 'friend' : 'friends'} in your circle',
                style: const TextStyle(color: AppColors.bronze, fontSize: 12),
              ),
            ),
          ),
      ],
    );
  }
}

class AnkhIcon extends StatelessWidget {
  final int size;
  final Color color;

  const AnkhIcon({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return Icon(Icons.favorite, size: size.toDouble(), color: color);
  }
}

/// Small helper widget for the animated slide+fade-in of each row.
class _AnimatedFriendRow extends StatelessWidget {
  final int index;
  final bool animate;
  final Widget child;

  const _AnimatedFriendRow({
    required this.index,
    required this.animate,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final delay = Duration(milliseconds: 60 * index);

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: animate ? 1 : 0),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 12 * (1 - value)),
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}

/// Tile used inside the Pending Requests panel.
class _PendingRequestTile extends StatelessWidget {
  final UIFriend friend;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  const _PendingRequestTile({
    required this.friend,
    required this.onAccept,
    required this.onDecline,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gold.withOpacity(0.6)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: AppColors.gold,
            child: Text(
              friend.nickname.isNotEmpty
                  ? friend.nickname[0].toUpperCase()
                  : '?',
              style: const TextStyle(
                color: AppColors.darkTeal,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  friend.nickname,
                  style: const TextStyle(
                    color: AppColors.darkTeal,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  friend.email,
                  style: const TextStyle(color: AppColors.bronze, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: onAccept,
            style: TextButton.styleFrom(
              backgroundColor: AppColors.darkTeal,
              foregroundColor: AppColors.gold,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            ),
            child: const Text('Accept'),
          ),
          const SizedBox(width: 6),
          TextButton(
            onPressed: onDecline,
            style: TextButton.styleFrom(
              backgroundColor: const Color(0xFFF2B9A0),
              foregroundColor: const Color(0xFFC1440E),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            ),
            child: const Text('Decline'),
          ),
        ],
      ),
    );
  }
}
