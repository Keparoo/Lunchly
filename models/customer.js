/** Customer for Lunchly */

const db = require('../db');
const Reservation = require('./reservation');

/** Customer of the restaurant. */

class Customer {
	constructor({ id, firstName, lastName, phone, notes }) {
		this.id = id;
		this.firstName = firstName;
		this.lastName = lastName;
		this.phone = phone;
		this.notes = notes;
	}

	/** find all customers. */

	static async all() {
		const results = await db.query(
			`SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
		);
		return results.rows.map((c) => new Customer(c));
	}

	/** get a customer by ID. */

	static async get(id) {
		const results = await db.query(
			`SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
			[ id ]
		);

		const customer = results.rows[0];

		if (customer === undefined) {
			const err = new Error(`No such customer: ${id}`);
			err.status = 404;
			throw err;
		}

		return new Customer(customer);
	}

	/** get all reservations for this customer. */

	async getReservations() {
		return await Reservation.getReservationsForCustomer(this.id);
	}

	/** save this customer. */

	async save() {
		if (this.id === undefined) {
			const result = await db.query(
				`INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
				[ this.firstName, this.lastName, this.phone, this.notes ]
			);
			this.id = result.rows[0].id;
		} else {
			await db.query(
				`UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
				[ this.firstName, this.lastName, this.phone, this.notes, this.id ]
			);
		}
	}

	// return the full name
	get fullName() {
		return `${this.firstName} ${this.lastName}`;
	}

	// Find customer by name
	static async findCustomer(first, last) {
		const results = await db.query(
			`SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE (first_name = $1 AND last_name = $2)`,
			[ first, last ]
		);

		const customer = results.rows[0];

		if (customer === undefined) {
			const err = new Error(`No such customer: ${first} ${last}`);
			err.status = 404;
			throw err;
		}

		return new Customer(customer);
	}

	// Find top 10 customers
	static async findTop() {
		const results = await db.query(
			`SELECT c.id, c.first_name AS firstName, c.last_name AS lastName, c.phone, c.notes,
            COUNT (c.first_name) AS ct
            FROM reservations r
            JOIN customers c
            ON r.customer_id = c.id
            GROUP BY r.customer_id, c.id, c.first_name, c.last_name, c.phone, c.notes
            ORDER BY ct DESC
            LIMIT 10;`
		);

		if (results.rows.length === 0) {
			const err = new Error(`No customers found`);
			err.status = 404;
			throw err;
		}

		return results.rows.map(
			(c) =>
				new Customer({
					id: c.id,
					firstName: c.firstname,
					lastName: c.lastname,
					phone: c.phone,
					notes: c.notes
				})
		);
	}
}

module.exports = Customer;
