import nodemailer from 'nodemailer';

export let transporter = nodemailer.createTransport({
	host: 'smtp-relay.brevo.com',
	port: 587,
	secure: false, // true for 465, false for other ports
	auth: {
		user: process.env.ADMIN_EMAIL,
		pass: process.env.SMTP_PASSWORD
	}
});
