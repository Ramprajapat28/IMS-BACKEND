const express = require("express");
const { expressjwt: jwt } = require("express-jwt");

const AuthModel = require("../../models/AuthModel");
const AuthenticationError = require("../../errorhandlers/AuthenticationError");
const AccessPermissionError = require("../../errorhandlers/AccessPermissionError");
const { RES_LOCALS } = require("./constant");

const Router = express.Router();
const openrouter = express.Router();

const Authloginrouter = require("../../routes/controllers/open/authloginRouter");
const RoomRouter = require("../../routes/controllers/RoomRouter");
const ShelfRouter = require("../../routes/controllers/shelfRouter");
const RackRouter = require("../../routes/controllers/RackRouter");
const WarehouseRouter = require("../../routes/controllers/warehouseRouter");
const Authrouter = require("../../routes/controllers/Authrouter");
const vendorRouter = require("../../routes/controllers/vendorRouter")
const ShopifyRouter = require("../controllers/open/shopifyRouter");
const ItemRouter = require("../../routes/controllers/ItemRouter");
const OrderRouter = require("../../routes/controllers/OrderRouter");
const ProductRouter = require("../../routes/controllers/ProductRouter");
const UserRouter = require("../../routes/controllers/userRouter");
const CategoryRouter = require("../../routes/controllers/CategoryRouter");

const DashboardRouter = require("../../routes/controllers/DashboardRouter");


class RouteMap {
  static setupRoutesAndAuth(app) {

    // 🔓 OPEN ROUTES
    app.use("/open/api/", openrouter);
    // 🔓 OPEN ROUTES (NO JWT)
    app.use("/open/api/auth",Authrouter);
    // app.use("/open/api/barcode",ProductRouter);


    openrouter.use("/auth",Authrouter);
    openrouter.use("/shopify",ShopifyRouter);
    openrouter.use("/auth", Authloginrouter);


    //  PROTECTED ROUTES
    app.use(
      "/api",
      ...RouteMap._setupAuth(),
      RouteMap._addUserInformation,
      Router
    );

    // Router.use("/auth", Authrouter);
    Router.use("/users", UserRouter);
    Router.use("/rooms", RoomRouter);
    Router.use("/shelfs", ShelfRouter);
    Router.use("/racks", RackRouter);
    Router.use("/warehouses", WarehouseRouter);
    Router.use("/vendors", vendorRouter );
    Router.use("/items", ItemRouter);
    Router.use("/products", ProductRouter);
    Router.use("/orders", OrderRouter);
    Router.use("/category", CategoryRouter);  
    Router.use("/dashboard", DashboardRouter);

    




    //  404 HANDLER
    app.use((req, res) => {
      res.status(404).json({
        status: 404,
        message: "Specified path not found"
      });
    });

     

  }

  static _setupAuth() {
    const attachLocals = (req, res, next) => {
      req._locals = res.locals;
      next();
    };

    const authJwt = jwt({
      secret: process.env.JWT_SECRET_KEY,
      algorithms: ["HS256"],
      getToken: (req) => {
        if (req.headers.authorization) {
          return req.headers.authorization.split(" ")[1];
        }
        return null;
      }
    }).unless({
      path: [
        "/open/api/auth/login",
        "/open/api/auth/register"
      ]
    });

    return [
      attachLocals,
      authJwt,
      (err, req, res, next) => {
        if (err.name === "UnauthorizedError") {
          return res.status(401).json({
            status: 401,
            message: "Invalid or missing token"
          });
        }
        next(err);
      }
    ];
  }

  static async _addUserInformation(req, res, next) {
    try {
      const decoded = req.auth;

      if (!decoded?.user_id || !decoded?.email) {
        throw new AuthenticationError("Invalid token");
      }

      const authModel = new AuthModel();
      const userData = await authModel.getUserRoleById(decoded.email);

      if (!userData || !userData.roles?.length) {
        throw new AccessPermissionError();
      }

      res.locals[RES_LOCALS.USER_INFO.KEY] = {
        user: {
          user_id: decoded.user_id,
          email: decoded.email,
          role_id: userData.roles[0].role_id,
          roles: userData.roles
        },
        roles: userData.roles
      };

      next();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = RouteMap;













// const express = require("express");
// const { expressjwt: jwt } = require("express-jwt");
// const { RES_LOCALS } = require("./constant");
// const Router = express.Router();
// const openRouter = express.Router();
// const AccessPermissionError = require("../../errorhandlers/AccessPermissionError");
// const UserModel = require("../../models/UserModel");
// const AuthenticationError = require("../../errorhandlers/AuthenticationError");
// const JwtUtilities = require("../utilities/JwtUtilities")


// // openRouter 
// const authenticationRouter = require("../controllers/authenticationRouter")

// const shelf = require("../controllers/shelfRouter")


// class RouteMap {
//     static setupRoutesAndAuth(app) {


//         app.use(
//             "/api",
//              ...RouteMap._setupAuth(),
//             RouteMap._addUserInformation,
           
//             Router
//         );
//         // router.use("/common_registration", commonRegistrationRouter);
//         Router.use("/shelf", shelf );

//         // app.use('api/v1/auth', require("../controllers/auth.routes"));
//         app.use('api/v1/rooms', require("../user.routes"));

    

//         app.get('/meow', (req, res) => {
//             res.json({ 'meow': 'meow' });
//         });

      

//         app.use("/open/api", openRouter);

//         app.use("/open/api/rooms", require("../room.routes"));
        

//         openRouter.use("/authentication", authenticationRouter);
//         //  openRouter.use("/shelf", shelf );


//         app.use((req, res, next) => {
//             const referer = req.headers['referer'] ? req.headers['referer'] : "-";
//             console.error(`Invalid route accessed: ${req.originalUrl} ${referer}`);
//             res.status(404).json({
//                 error: 'Specified path not found',
//             });
//         });
//     }

//     static _setupAuth() {
//         const attachLocals = (req, res, next) => {
//             req._locals = res.locals;
//             next();
//         };

//         const getDynamicSecret = (req, payload, done) => {
//             try {
//                 const locals = req._locals || {};
//                 // Example: choose secret based on a value in res.locals
//                 let secret = process.env.JWT_SECRET_KEY;
//                 if (locals && locals.userInfo && locals.userInfo.roles && locals.userInfo.roles.length) {
//                     secret = process.env.JWT_SECRET_KEY_1;
//                 }
//                 done(null, secret);
//             } catch (err) {
//                 done(err);
//             }
//         };
//         const authJwt = jwt({
//             secret: getDynamicSecret,
//             algorithms: ["HS256"],
//             getToken: (req) => {
//                 if (req.headers["authorization"]) {
//                     const authorizationHeader = req.headers["authorization"];
//                     return authorizationHeader.split(" ")[1];
//                 }
//             }
//         });
//         // return authJwt.unless({ path: [] })
//         // next();

        
//         return [
//             attachLocals,
//             authJwt.unless({ path: [] }),
//             (err, req, res, next) => {
//                 if (err.name === "UnauthorizedError") {
//                     return res.status(401).json({ error: "Invalid or missing token" });
//                 }
//                 next();
//             }
//         ]
//     }

//     static async _addUserInformation(req, res, next) {
//         let jwtToken;
//         if (req.headers["authorization"]) {
//             jwtToken = req.headers["authorization"].split(" ")[1];
//         } else {
//             next(new AccessPermissionError());
//             return;
//         }
//         console.log("this is a jwt token ",jwtToken)

//         const userModel = new UserModel() ;
//         let secret = process.env.JWT_SECRET_KEY;
//         let userRoles;

//         try {
//             const decodedPayload = JwtUtilities.decodeJWT(jwtToken);
//             console.log(jwtToken,"token value")
//             console.log(decodedPayload)
//             userRoles = decodedPayload && decodedPayload['user'] && decodedPayload['user']['email'] ? await userModel.getUserRoleById({ email: decodedPayload['user']['email']}) : null;
//             console.log("user roles",userRoles)
//             if (userRoles && userRoles.length) {
//                 console.log("different secret used");
//                 secret = process.env.JWT_SECRET_KEY_1;
//             }
//         } catch (err) {
//             console.error("Error decoding JWT:", err);
//         }

//         try {
//             let payload;
//             try {
//                 payload = JwtUtilities.verifyJWT(jwtToken, secret);
//             } catch (err) {
//                 next(new AuthenticationError("Invalid Token"));
//             }

//             const payloadUser = payload["user"];
//             const userId = payloadUser["user_id"];
//             const email = payloadUser["email"];
            


//             const userInformation = await userModel.getUserRoleById({ email });

//             if (!userInformation) {
//                 next(new AccessPermissionError());
//                 return;
//             }

//             const user = {
//                 "user_id": userInformation["user_id"],
//                 "name": userInformation["name"],
//                 "email_id": userInformation["email_id"],
//                 "mobile_number": userInformation["mobile_number"]

//             };




//             // res.locals[RES_LOCALS.USER_INFO.KEY] = { user, roles: userRoles, organization, organizations: userOrganizations };
//              res.locals[RES_LOCALS.USER_INFO.KEY] = { user, roles: userRoles };
//             next();
//         } catch (err) {
//             console.error("JWT Verification Error:", err);
//             next(new AccessPermissionError());
//         }
//     }


// }

// module.exports = RouteMap;
