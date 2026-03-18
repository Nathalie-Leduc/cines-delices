// Export des middlewares
import jwt from 'jsonwebtoken';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireAuth(req, res, next) {
	const authHeader = req.headers.authorization || '';

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ message: 'Token manquant ou invalide.' });
	}

	const token = authHeader.slice('Bearer '.length).trim();

	if (!token) {
		return res.status(401).json({ message: 'Token manquant.' });
	}

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		const rawUserId = payload.userId ?? payload.id ?? payload.sub;

		if (rawUserId === undefined || rawUserId === null || rawUserId === '') {
			return res.status(401).json({ message: 'Token invalide.' });
		}

		const userId = String(rawUserId);

		if (!UUID_V4_REGEX.test(userId)) {
			return res.status(401).json({ message: 'Token invalide.' });
		}

		req.user = {
			id: userId,
			role: payload.role,
			email: payload.email,
		};

		return next();
	} catch {
		return res.status(401).json({ message: 'Token invalide ou expiré.' });
	}
}
