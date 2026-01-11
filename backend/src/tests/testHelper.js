const mockCreateChain = (data = null, error = null) => {
    const chain = {};

    const mockMethod = () => chain;
    const mockResolver = () => Promise.resolve({ data, error });

    chain.from = jest.fn(mockMethod);
    chain.select = jest.fn(mockMethod);
    chain.insert = jest.fn(mockMethod);
    chain.update = jest.fn(mockMethod);
    chain.delete = jest.fn(mockMethod);
    chain.eq = jest.fn(mockMethod);
    chain.is = jest.fn(mockMethod);
    chain.order = jest.fn(mockMethod);
    chain.limit = jest.fn(mockMethod);
    chain.range = jest.fn(mockMethod);
    chain.in = jest.fn(mockMethod);
    chain.single = jest.fn(mockResolver);
    chain.maybeSingle = jest.fn(mockResolver);

    // To support "await query"
    chain.then = (onRes) => Promise.resolve({ data, error }).then(onRes);
    chain.catch = (onErr) => Promise.resolve({ data, error }).catch(onErr);

    return chain;
};

module.exports = { mockCreateChain };
