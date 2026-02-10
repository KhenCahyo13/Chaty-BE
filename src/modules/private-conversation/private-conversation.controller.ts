import { Router } from "express";

import { toHttpError } from "@lib/http-error";
import { errorResponse, successResponse } from "@lib/response";
import { mapZodIssues } from "@lib/validation-error";
import { authenticateUser, type AuthRequest } from "@middlewares/auth.middleware";
import { createPrivateConversationSchema } from "./private-conversation.schema";
import { createPrivateConversation } from "./private-conversation.service";

const router = Router();

router.post("", authenticateUser, async (req, res) => {
    const parsed = createPrivateConversationSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
        return res
            .status(400)
            .json(
                errorResponse(
                    "Payload is not valid.",
                    mapZodIssues(parsed.error.issues),
                ),
            );
    }

    try {
        const { userId } = (req as AuthRequest).auth;
        const result = await createPrivateConversation({
            user1Id: userId,
            user2Id: parsed.data.user_2_id,
        });

        return res.json(
            successResponse(
                "Private conversation created successfully.",
                result,
            ),
        );
    } catch (error) {
        const { statusCode, message, errors } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
});

export default router;