export type Customer = {
    _id?: string,
    fullname: string,
    phone?: string,
    email: string,
    password: string,
    isActive: boolean,
    createdAt?: string 
}

export type CustomerCreateInput = {
    fullname: string,
    phone?: string,
    email: string,
    password: string
}

export type CustomerUpdateInput = Partial<CustomerCreateInput>

export type CustomerResponse = Omit<Customer, "password">