const { ObjectId } = require('mongodb');
const { requireAuth } = require('./auth.middleware');

require('mongodb');
require('express');

exports.setApp = function(app, client){
    const users = client.db('COP4331Cards').collection('users');
    app.post('/api/addfriend', requireAuth, async(req, res, next) => {
        // incoming: userId
        const {friendEmail} = req.body;
        // const {friendId} = req.body;
        const userId = req.userId;
        let error ='';

        try{
            if(!userId || !friendEmail){
                return res.status(400).json({ error: 'Missing userId or friendEmail field.'})
            }
            const userObjectId = new ObjectId(userId);
            // const friendObjectId = new ObjectId(friendId);
            // const friendEmailId = new friendEmail;

            // first check if both users exist
            const user = await users.findOne({_id: userObjectId });
            // const friend = await users.findOne({ _id: friendObjectId});
            // const friendEmail = await users.findOne({email: friendEmailId});
            const friend = await users.findOne({email: friendEmail});

            // handle the case where one is not found
            if(!user || !friend){
                return res.status(400).json({ error: 'User not found'});
            }

            if(!friend.isVerified || !friend.google?.connected){
                return res.status(403).json({ error: 'Cannot add this friend - user not verified or connected with Google.'})
            }

            // check if they're already friends
            if(user.friends?.includes(friend._id)){
                return res.status(400).json({error: 'User is already your friend.'});
            }

            // check if request is already sent
            if(user.sentRequests?.includes(friend._id)){
                return res.status(400).json({error: 'Friend request already sent.'})
            }

            // add friend to current user's list
            await users.updateOne(
                {_id: userObjectId},
                { $addToSet: { sentRequests: friend._id }}
            );

            // add user to friend's list
            await users.updateOne(
                {_id: friend._id},
                {$addToSet: { receivedRequests: userObjectId }}
            );
            res.status(200).json({ message: 'Friend request sent successfully' });
        } catch (err) {
            console.error('Error sending friend request:', err);
            error = err.toString();
            res.status(500).json({ error });
        }
    });

    app.post('/api/acceptfriend', requireAuth, async(req, res, next) => {
        const { requesterId } = req.body;
        const userId = req.userId;
        const userObjectId = new ObjectId(userId);
        const requesterObjectId = new ObjectId(requesterId);

        try{
            const user = await users.findOne({ _id: userObjectId });
            const requester = await users.findOne({ _id: requesterObjectId });

            if(!user || !requester){
                return res.status(404).json({ error: 'User not found.'})
            }

            // remove pending request
            await users.updateOne(
                {_id: userObjectId},
                {
                    $pull: {receivedRequests: requesterObjectId},
                    $addToSet: {friends: requesterObjectId }
                }
            );
            await users.updateOne(
                {_id: requesterObjectId},
                {
                    $pull: {sentRequests: userObjectId},
                    $addToSet: {friends: userObjectId}
                }
            )
            res.status(200).json({message: 'Friend request accepted.'});
        }catch(err){
            console.error('Error accepting friend:', err);
            res.status(500).json({error: err.toString()});
        }
    })

    app.post('/api/declinefriend', requireAuth, async(req, res) => {
        const {requesterId} = req.body;
        const userId = req.userId;

        await users.updateOne(
            {_id: new ObjectId(userId)},
            {$pull: {receivedRequests: new ObjectId(requesterId)}}
        );

        await users.updateOne(
            {_id: new ObjectId(requesterId)},
            {$pull: {sentRequests: new ObjectId(userId)}}
        );
        res.status(200).json({ message: 'Friend request declined.'});
    })

    app.post("/api/removefriend", requireAuth, async (req, res, next) => {
        const {friendEmail} = req.body;
        const userId = req.userId;
        let error ='';

        try{
            if(!userId || !friendEmail){
                return res.status(400).json({ error: 'Missing userId or friendId field.'})
            }
            const userObjectId = new ObjectId(userId);
            // const friendObjectId = new ObjectId(friendId);

            // first check if both users exist
            const user = await users.findOne({_id: userObjectId });
            const friend = await users.findOne({ email: friendEmail});

            // handle the case where one is not found
            if(!user || !friend){
                return res.status(400).json({ error: 'User not found'});
            }

            // remove friend from user's friend array
            await users.updateOne(
                {_id: userObjectId},
                { $pull: { friends: friend._id }}
            );

            // remove user from friend's friend array
            await users.updateOne(
                {_id: friend._id},
                {$pull: { friends: userObjectId }}
            );
            res.status(200).json({ message: 'Friend removed successfully' });
        } catch (err) {
            console.error('Error removing friend:', err);
            error = err.toString();
            res.status(500).json({ error });
        }
    });
    
    app.get('/api/getfriends', requireAuth, async(req, res, next) => {
        const userId = req.userId;
        let error = '';


        try{
            if(!userId){
                return res.status(400).json({ error: 'UserId not found.'})
            }
            const userObjectId = new ObjectId(userId);
            const user = await users.findOne({_id: userObjectId});

            if(!user){
                return res.status(404).json({error: 'User not found'});
            }

            // if(!user.friends || user.friends.length === 0){
            //     return res.status(200).json({friends: []});
            // }

            const friendsList = await users.find({
                _id: {$in: user.friends}
            }).toArray();

            const sentRequestsList = await users.find({ 
                _id: { $in: user.sentRequests || [] }
            }).toArray();

            const receivedRequestsList = await users.find({ 
                _id: { $in: user.receivedRequests || [] } 
            }).toArray();

            // return friend list
            res.status(200).json({ 
                friends: friendsList,
                sentRequests: sentRequestsList,
                receivedRequests: receivedRequestsList
            });
        } catch (err) {
            console.error('Error retrieving friends list:', err);
            error = err.toString();
            res.status(500).json({error});
        }
    });
};