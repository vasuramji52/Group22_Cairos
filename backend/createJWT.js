// const jwt = require("jsonwebtoken");
// require("dotenv").config();

// exports.createToken = function ( fn, ln, id )
// {
//     return _createToken( fn, ln, id );
// }

// _createToken = function ( fn, ln, id )
// {
//     try
//     {
//       const expiration = new Date();
//       const user = {userId:id,firstName:fn,lastName:ln};

//       const accessToken =  jwt.sign( user, process.env.ACCESS_TOKEN_SECRET);

//       // In order to exoire with a value other than the default, use the 
//        // following
//       /*
//       const accessToken= jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, 
//          { expiresIn: '30m'} );
//                        '24h'
//                       '365d'
//       */

//       var ret = {accessToken:accessToken};
//     }
//     catch(e)
//     {
//       var ret = {error:e.message};
//     }
//     return ret;
// }

// exports.isExpired = function( token )
// {
   
//    var isError = jwt.verify( token, process.env.ACCESS_TOKEN_SECRET, 
//      (err, verifiedJwt) =>
//    {
//      if( err )
//      {
//        return true;
//      }
//      else
//      {
//        return false;
//      }
//    });

//    return isError;

// }

// exports.refresh = function( token )
// {
//   var ud = jwt.decode(token,{complete:true});

//   var userId = ud.payload.id;
//   var firstName = ud.payload.firstName;
//   var lastName = ud.payload.lastName;

//   return _createToken( firstName, lastName, userId );
// }


// exports.refresh = function( token )
// {
//   var ud = jwt.decode(token,{complete:true});

//   var userId = ud.payload.id;
//   var firstName = ud.payload.firstName;
//   var lastName = ud.payload.lastName;

//   return _createToken( firstName, lastName, userId );
// }

const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.createToken = function (fn, ln, id) {
  return _createToken(fn, ln, id);
};

function _createToken(fn, ln, id) {
  try {
    const user = { userId: id, firstName: fn, lastName: ln };

    // If you want expiry, uncomment expiresIn
    // const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

    return { accessToken };
  } catch (e) {
    return { error: e.message };
  }
}

// Returns true if token is invalid/expired; false if valid
exports.isExpired = function (token) {
  try {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return false;
  } catch {
    return true;
  }
};

exports.refresh = function (token) {
  // You signed with { userId, firstName, lastName }
  const ud = jwt.decode(token); // { userId, firstName, lastName } or null
  const userId = ud?.userId;
  const firstName = ud?.firstName;
  const lastName = ud?.lastName;

  // If token can’t be decoded, return an empty token object
  if (!userId) return { accessToken: "" };

  return _createToken(firstName, lastName, userId);
};
