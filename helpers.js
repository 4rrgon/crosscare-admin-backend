export const checkString = (string) => {
    if (!string) throw 'You must provide a string'
    if (typeof string !== 'string') throw `${string} must be a string`
    string = string.trim()
    if (string.length === 0)
        throw `${string} cannot be an empty string or string with just spaces`
    return string
}

export const checkEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);

}

export const checkName = (name) => {
    name = checkString(name)
    if (name.length < 2 || name.length > 40)
        throw `${name} must be between 2 and 40 characters long`
    return name
}

export const checkPassword = (password) => {
    password = checkString(password)
    if (password.includes(' '))
        throw `Password can't contain spaces`
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password))
        throw `Password needs to have atleast one uppercase letter, one number, and one special character`
    if (password.length < 8)
        throw `Password needs to be at least 8 characters long`
    return password
}

export const checkRole = (role) => {
    role = checkString(role)
    if (role.toLowerCase() !== "tenant admin" && role.toLowerCase() !== "super admin" && role.toLowerCase() !== "support")
        throw `${role} needs to be either tenant admin, support, or super admin`
    return role
}

export function getSignupDate() {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()

    return `${month}/${day}/${year}`
}

export function getLastLogin() {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()

    let hours = now.getHours()
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'

    hours = hours % 12
    hours = hours ? hours : 12
    const formattedHour = String(hours).padStart(2, '0')

    return `${month}/${day}/${year} ${formattedHour}:${minutes}${ampm}`
}