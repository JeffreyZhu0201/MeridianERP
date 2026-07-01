/**
 * 商店认证模块的数据传输对象（DTO）
 *
 * 定义消费者注册和登录的请求参数格式和验证规则。
 *
 * @module store-auth dto
 */

import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 消费者注册请求 DTO
 *
 * 验证规则：
 * - email: 必须是有效的邮箱格式
 * - password: 至少 8 个字符的字符串
 * - firstName: 可选，最多 100 个字符
 * - lastName: 可选，最多 100 个字符
 *
 * @example
 * {
 *   email: "customer@example.com",
 *   password: "securePassword123",
 *   firstName: "张",
 *   lastName: "三"
 * }
 */
export class StoreRegisterDto {
  /** 消费者邮箱 - 必须是唯一且有效的邮箱格式 */
  @IsEmail()
  email!: string;

  /** 密码 - 至少 8 个字符，用于后续登录验证 */
  @IsString()
  @MinLength(8)
  password!: string;

  /** 名 - 可选，消费者的名字 */
  @IsOptional()
  @IsString()
  firstName?: string;

  /** 姓 - 可选，消费者的姓氏 */
  @IsOptional()
  @IsString()
  lastName?: string;
}

/**
 * 消费者登录请求 DTO
 *
 * 验证规则：
 * - email: 必须是有效的邮箱格式
 * - password: 至少 6 个字符
 *
 * @example
 * {
 *   email: "customer@example.com",
 *   password: "securePassword123"
 * }
 */
export class StoreLoginDto {
  /** 消费者邮箱 - 用于查找账户 */
  @IsEmail()
  email!: string;

  /** 密码 - 用于验证身份，最少 6 个字符 */
  @IsString()
  @MinLength(6)
  password!: string;
}
