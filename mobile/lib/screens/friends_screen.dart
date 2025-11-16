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

  List<UIFriend> _friends = [];
  List<UIFriend> _incoming = [];
  List<UIFriend> _outgoing = [];

  bool _loading = true;
  bool _adding = false;
  bool _animateList = false;

  @override
  void initState() {
    super.initState();
    _loadFriends();
    // small delay so items animate in after first frame
    Future.delayed(const Duration(milliseconds: 120), () {
      if (mounted) {
        setState(() => _animateList = true);
      }
    });
  }

  @override
  void dispose() {
    _addController.dispose();
    _searchController.dispose();
    _scrollController.dispose();
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

  void _scrollToAddCard() {
    _scrollController.animateTo(
      200, // roughly where the add card is
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeOut,
    );
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
              const Text(
                'Your Circle',
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Manage your companions and connections',
                style: TextStyle(color: AppColors.bronze),
              ),
              const SizedBox(height: 16),
              const EgyptianBorder(),
              const SizedBox(height: 16),

              // Pending Requests Card
              _buildPendingCard(),

              const SizedBox(height: 16),

              // Add Friend Card
              _buildAddFriendCard(),

              const SizedBox(height: 16),

              // Search Card
              _buildSearchCard(),

              const SizedBox(height: 16),

              // Friends List / Empty state
              _buildFriendsList(filtered),

              const SizedBox(height: 80), // space for FAB
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPendingCard() {
    return PapyrusCard(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(Icons.group_add_outlined, color: AppColors.darkTeal),
                SizedBox(width: 8),
                Text(
                  'Pending Requests',
                  style: TextStyle(
                    color: AppColors.darkTeal,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            const Text(
              'Accept or decline pending friend requests',
              style: TextStyle(color: AppColors.accentTeal, fontSize: 12),
            ),
            const SizedBox(height: 12),
            if (_loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  'Loading...',
                  style: TextStyle(color: AppColors.accentTeal),
                ),
              )
            else if (_incoming.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  'No pending requests',
                  style: TextStyle(color: AppColors.accentTeal),
                ),
              )
            else
              Column(
                children: [
                  for (int i = 0; i < _incoming.length; i++)
                    _AnimatedFriendRow(
                      index: i,
                      animate: _animateList,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: _PendingRequestTile(
                          friend: _incoming[i],
                          onAccept: () => _handleAccept(_incoming[i].id),
                          onDecline: () => _handleDecline(_incoming[i].id),
                        ),
                      ),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddFriendCard() {
    return PapyrusCard(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Icon(
                  Icons.person_add_alt_1_outlined,
                  color: AppColors.darkTeal,
                ),
                SizedBox(width: 8),
                Text(
                  'Add New Friend',
                  style: TextStyle(
                    color: AppColors.darkTeal,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            const Text(
              'Add friends by their email address (they must have a Cairos account and be verified).',
              style: TextStyle(color: AppColors.accentTeal, fontSize: 12),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _addController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      hintText: 'friend@gmail.com',
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: AppColors.gold),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: AppColors.darkTeal),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _adding ? null : _handleAddFriend,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.darkTeal,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  child: Text(
                    _adding ? 'Adding...' : 'Add Friend',
                    style: const TextStyle(color: AppColors.gold),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchCard() {
    return PapyrusCard(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          children: [
            const Icon(Icons.search, color: AppColors.accentTeal),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _searchController,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(
                  hintText: 'Search friends...',
                  border: InputBorder.none,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFriendsList(List<UIFriend> filtered) {
    if (_loading) {
      return PapyrusCard(
        margin: EdgeInsets.zero,
        child: const Padding(
          padding: EdgeInsets.symmetric(vertical: 24),
          child: Center(
            child: CircularProgressIndicator(color: AppColors.darkTeal),
          ),
        ),
      );
    }

    if (filtered.isEmpty) {
      return PapyrusCard(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              AnkhIcon(size: 40, color: AppColors.gold),
              SizedBox(height: 12),
              Text(
                'No friends yet',
                style: TextStyle(color: AppColors.accentTeal, fontSize: 14),
              ),
              SizedBox(height: 4),
              Text(
                'Add friends by their email address to start finding the perfect time to meet.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.bronze, fontSize: 12),
              ),
            ],
          ),
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
              child: PapyrusCard(
                margin: EdgeInsets.zero,
                child: Padding(
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
                            if (filtered[i].firstName.isNotEmpty ||
                                filtered[i].lastName.isNotEmpty)
                              Text(
                                '${filtered[i].firstName} ${filtered[i].lastName}'
                                    .trim(),
                                style: const TextStyle(
                                  color: AppColors.accentTeal,
                                  fontSize: 12,
                                ),
                              ),
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

/// Tile used inside the Pending Requests card.
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
        color: Colors.white.withOpacity(0.85),
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
