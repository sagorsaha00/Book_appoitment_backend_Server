export class UserController {
    constructor(userService, database) {
        this.userService = userService;
        this.database = database;
    }

    async createUser(req, res) {
        try {
            const databas = this.database.collection("users")
            const userData = req.body;
            if (!userData.name || !userData.email || !userData.password) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            if (await databas.findOne({ email: userData.email })) {
                return res.status(409).json({ error: 'Email already exists' });
            }

            if (await databas.findOne({ name: userData.name })) {
                return res.status(409).json({ error: 'Name already exists' });
            }

            const newUser = await this.userService.createuser(userData);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create user' });
        }
    }
    async loginUser(req, res) {
        try {
            const { email, password } = req.body;
            const token = await this.userService.loginuser(email, password);
            res.status(200).json({ token });
        } catch (error) {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    }
    async getAllUsers(req, res) {
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
            const { requestId } = req.body; // Pass the specific request ID to approve

             
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
}


//user comment
//pending book
//book read
//pending delivary
//total spent

//request delivary
//delivary history