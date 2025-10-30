const { ObjectId } = require('mongodb');

require('mongodb');
require('express');

exports.setApp = function(app, client){
    const users = client.db('COP4331Cards').collection('users');
    app.post('/api/addfriend', async(req, res, next) => {
        // incoming: userId
        const {userId, friendId} = req.body;
        let error ='';

        try{
            if(!userId || !friendId){
                return res.status(400).json({ error: 'Missing userId or friendId field.'})
            }
            const userObjectId = new ObjectId(userId);
            const friendObjectId = new ObjectId(friendId);

            // first check if both users exist
            const user = await users.findOne({_id: userObjectId });
            const friend = await users.findOne({ _id: friendObjectId});

            // handle the case where one is not found
            if(!user || !friend){
                return res.status(400).json({ error: 'User not found'});
            }

            if(!friend.isVerified || !friend.google?.connected){
                return res.status(403).json({ error: 'Cannot add this friend - user not verified or connected with Google.'})
            }

            // add friend to current user's list
            await users.updateOne(
                {_id: userObjectId},
                { $addToSet: { friends: friendObjectId }}
            );

            // add user to friend's list
            await users.updateOne(
                {_id: friendObjectId},
                {$addToSet: { friends: userObjectId }}
            );
            res.status(200).json({ message: 'Friend added successfully' });
        } catch (err) {
            console.error('Error adding friend:', err);
            error = err.toString();
            res.status(500).json({ error });
        }
    });

    app.post("/api/removefriend", async (req, res, next) => {
        const {userId, friendId} = req.body;
        let error ='';

        try{
            if(!userId || !friendId){
                return res.status(400).json({ error: 'Missing userId or friendId field.'})
            }
            const userObjectId = new ObjectId(userId);
            const friendObjectId = new ObjectId(friendId);

            // first check if both users exist
            const user = await users.findOne({_id: userObjectId });
            const friend = await users.findOne({ _id: friendObjectId});

            // handle the case where one is not found
            if(!user || !friend){
                return res.status(400).json({ error: 'User not found'});
            }

            // remove friend from user's friend array
            await users.updateOne(
                {_id: userObjectId},
                { $pull: { friends: friendObjectId }}
            );

            // remove user from friend's friend array
            await users.updateOne(
                {_id: friendObjectId},
                {$pull: { friends: userObjectId }}
            );
            res.status(200).json({ message: 'Friend removed successfully' });
        } catch (err) {
            console.error('Error removing friend:', err);
            error = err.toString();
            res.status(500).json({ error });
        }
    });
    
    app.get('/api/getfriends', async(req, res, next) => {
        const {userId} = req.body;
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

            if(!user.friends || user.friends.length === 0){
                return res.status(200).json({friends: []});
            }

            const friendsList = await users.find({
                _id: {$in: user.friends}
            }).toArray();

            // return friend list
            res.status(200).json({ friends: friendsList})
        } catch (err) {
            console.error('Error retrieving friends list:', err);
            error = err.toString();
            res.status(500).json({error});
        }
    });
};