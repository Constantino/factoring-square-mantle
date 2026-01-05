import { Request, Response } from 'express';

export const getExample = (req: Request, res: Response): void => {
    res.json({ message: 'Hello from GET endpoint!' });
};

export const postExample = (req: Request, res: Response): void => {
    res.json({
        message: 'Hello from POST endpoint!',
        receivedData: req.body
    });
};

