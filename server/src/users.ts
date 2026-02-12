import bcrypt from "bcryptjs";

export interface User {
  id: string;
  username: string;
  password: string; // хеш
}

const users: User[] = [];

export const findUserByUsername = (username: string): User | undefined => {
  return users.find((u) => u.username === username);
};

export const createUser = async (
  username: string,
  password: string,
): Promise<boolean> => {
  if (findUserByUsername(username)) return false;

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: Date.now().toString(),
    username,
    password: hashedPassword,
  };
  users.push(newUser);
  return true;
};
