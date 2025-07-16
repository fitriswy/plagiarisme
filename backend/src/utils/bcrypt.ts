import { compare, hash } from "bcryptjs"

const saltAround = 10;

export async function hashing(password: string): Promise<string | null> {
    try {
        const hashed = hash(password, saltAround)
        return hashed;
    } catch (error: any) {
        console.log(`gagal hashing password: ${error.message}`);
        return null;
    }
}

export async function verifyHash(inputPassword: string, storedPassword: string): Promise<boolean> {
    try {
        const match = await compare(inputPassword, storedPassword);
        return match ? true : false;

    } catch (error: any) {
        console.log(`gagal verifikasi password: ${error.message}`);
        return false
    }
}