/** Reservation for Lunchly */

const moment = require('moment');

const db = require('../db');

/** A reservation for a party */

class Reservation {
	constructor({ id, customerId, numGuests, startAt, notes }) {
		this.id = id;
		this.customerId = customerId;
		this.numGuests = numGuests;
		this.startAt = startAt;
		this.notes = notes;
	}

	// Set numGuests: Error if less than 1
	set numGuests(val) {
		if (val < 1) {
			throw new Error(`Reservation must be for 1 or more people`, 400);
		}
		this._numGuests = val;
	}

	get numGuests() {
		return this._numGuests;
	}

	// Set startAt: error if not a date or not a number
	set startAt(val) {
		if (val instanceof Date && !isNaN(val)) {
			this._startAt = val;
		} else {
			throw new Error('startAt is not valid', 400);
		}
	}

	get startAt() {
		return this._startAt;
	}

	/** formatter for startAt */

	getformattedStartAt() {
		return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
	}

	// Check to see if customer id is already set: If so throw error on try to change
	set customerId(val) {
		if (this._customerId && this._customerId !== val) {
			throw new Error('Customer ID cannot be changed');
		}
		this._customerId = val;
	}

	get customerId() {
		return this._customerId;
	}

	/** given a customer id, find their reservations. */

	static async getReservationsForCustomer(customerId) {
		const results = await db.query(
			`SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
			[ customerId ]
		);

		return results.rows.map((row) => new Reservation(row));
	}

	// Save a reservation
	async save() {
		if (this.id === undefined) {
			const result = await db.query(
				`INSERT INTO reservations (customer_id, num_guests, start_at, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
				[ this.customerId, this.numGuests, this.startAt, this.notes ]
			);
			this.id = result.rows[0].id;
		} else {
			await db.query(
				`UPDATE reservations SET num_guests=$1, startAt=$2, notes=$3
     WHERE id=$4`,
				[ this.numGuests, this.startAt, this.notes, this.id ]
			);
		}
	}
}

module.exports = Reservation;
