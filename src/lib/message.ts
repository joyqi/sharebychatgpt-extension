export type ResponseType = 'message' | 'error' | 'end';

export type Response = {
    type: ResponseType;
    data?: any;
};

export type RequestType = 'ask';

export type Request = {
    type: RequestType;
    data?: any;
}