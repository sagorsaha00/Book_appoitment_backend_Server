
import { OAuth2Client } from "google-auth-library";


console.log("process.env.GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID)
const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "postmessage"
);
export class UserController {
    constructor(userService, database) {
        this.userService = userService;
        this.database = database;
    }

    async createUser(req, res) {
        console.log("createUser");
        try {
            const databas = this.database.collection("users");
            const userData = req.body;

            if (!userData.name || !userData.email || !userData.password) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            if (await databas.findOne({ email: userData.email })) {
                return res.status(409).json({ error: 'Email already exists' });
            }

            const newUser = await this.userService.createuser(userData);
            console.log("newUser sent to frontend:", newUser);
            res.status(201).json({ user: newUser });

        } catch (error) {
            console.error("Controller Error:", error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    }
    async googleSignInController(req, res) {
        try {
            const { name, email, image } = req.body;

            let user = await this.database.collection("users").findOne({ email });

            if (!user) {
                const newUser = {
                    name,
                    email,
                    picture: image,
                    role: "user",
                    createdAt: new Date(),
                };

                const result = await this.database
                    .collection("users")
                    .insertOne(newUser);

                user = {
                    _id: result.insertedId,
                    ...newUser,
                };
            }

            return res.status(200).json({
                success: true,
                user,
            });

        } catch (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    async loginUser(req, res) {
        console.log("loginUser")
        try {
            console.log("req.body", req.body)
            const { email, password } = req.body;
            const userInfo = await this.userService.loginuser(email, password);
            console.log("token", userInfo)
            res.status(200).json({ user: userInfo });
        } catch (error) {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    }
    async getAllUsers(req, res) {
        console.log("getAllUsers")
        try {
            //   const userData = req.body;
            //   if(!userData.role === "admin") {
            //     return res.status(403).json({ error: 'Access denied' });
            //   }
            const users = await this.userService.getAllUsers();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve users' });
        }
    }

    async deleteUser(req, res) {
        try {
            //   const userData = req.body;
            //   if(!userData.role === "admin") {
            //     return res.status(403).json({ error: 'Access denied' });
            //   }
            const { userId } = req.params;
            console.log("Deleting user with ID:", userId);


            const result = await this.userService.deleteuser(userId);
            if (!result || result.deletedCount === 0) {
                return res.status(404).json({ error: 'User not found' });
            }


            return res.status(200).json({ message: 'User deleted successfully' });

        } catch (error) {
            console.error("Error in deleteUser controller:", error);
            return res.status(500).json({ error: 'Failed to delete user' });
        }
    }

    async updateUserRole(req, res) {
        try {
            const { userId } = req.params;
            const { role } = req.body;
            const result = await this.userService.updateuserrole(userId, role);
            if (!result || result.modifiedCount === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json({ message: 'User role updated successfully' });
        } catch (error) {
            console.error("Error in updateUserRole controller:", error);
            return res.status(500).json({ error: 'Failed to update user role' });
        }
    }
    async bookRead(req, res) {
        try {
            const { userId, bookId } = req.body;
            const result = await this.userService.bookread(userId, bookId);
            if (!result) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json({ message: 'Book read successfully' });
        } catch (error) {
            console.error("Error in bookRead controller:", error);
            return res.status(500).json({ error: 'Failed to book read' });
        }
    }
    async wishlistBook(req, res) {
        try {
            const { userId, bookId } = req.body;
            const result = await this.userService.wishlistBook(userId, bookId);
            if (!result) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json({ message: 'Book added to wishlist successfully' });
        } catch (error) {
            console.error("Error in wishlistBook controller:", error);
            return res.status(500).json({ error: 'Failed to add book to wishlist' });
        }
    }
    async removeFromWishlist(req, res) {
        try {
            const { userId, bookId } = req.body;
            const result = await this.userService.removefromwishlist(userId, bookId);
            if (!result) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json({ message: 'Book removed from wishlist successfully' });
        } catch (error) {
            console.error("Error in removeFromWishlist controller:", error);
            return res.status(500).json({ error: 'Failed to remove book from wishlist' });
        }
    }
    async requestDelivery(req, res) {
        try {
            const { userId, bookId } = req.body;
            const result = await this.userService.requestDelivery(userId, bookId);



            return res.status(200).json({
                message: 'Delivery request submitted. Status: PENDING',
                data: result
            });
        } catch (error) {
            console.error("Error in requestDelivery controller:", error);
            return res.status(500).json({ error: 'Failed to send delivery request' });
        }
    }
    async adminApproveDelivery(req, res) {
        try {
            const { requestId } = req.body;


            const result = await this.userService.approveDeliveryRequest(requestId);

            if (!result) {
                return res.status(404).json({ error: 'Delivery request not found' });
            }

            return res.status(200).json({
                message: 'Request approved successfully. User notified.',
                data: result
            });
        } catch (error) {
            console.error("Error in adminApproveDelivery controller:", error);
            return res.status(500).json({ error: 'Failed to approve delivery request' });
        }
    }
    async getUserApprovedBooks(req, res) {
        try {
            const { userId } = req.params;
            const approvedBooks = await this.userService.getApprovedBooksForUser(userId);
            return res.status(200).json({
                success: true,
                count: approvedBooks.length,
                books: approvedBooks
            });

        } catch (error) {
            console.error("Error fetching user approved books:", error);
            return res.status(500).json({ error: 'Failed to retrieve your books' });
        }
    }
}


//user comment
//pending book
//book read
//pending delivary
//total spent

//request delivary
//delivary history