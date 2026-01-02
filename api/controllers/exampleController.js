const getExample = (req, res) => {
    res.json({ message: 'Hello from GET endpoint!' });
};

const postExample = (req, res) => {
    res.json({
        message: 'Hello from POST endpoint!',
        receivedData: req.body
    });
};

module.exports = {
    getExample,
    postExample
};

