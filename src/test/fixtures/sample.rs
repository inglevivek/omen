use actix_web::{get, post, web, HttpResponse};
use serde::{Deserialize, Serialize};
use tokio::fs;

/// Represents a user in the system
pub struct User {
    pub id: u32,
    pub name: String,
}

/// Trait for data persistence
pub trait Repository {
    fn find_by_id(id: u32) -> Option<User>;
    fn save(user: User) -> bool;
}

pub enum Status {
    Active,
    Inactive,
    Pending,
}

/// Returns all users
#[get("/users")]
pub async fn get_users() -> HttpResponse {
    HttpResponse::Ok().finish()
}

/// Creates a new user
#[post("/users")]
pub async fn create_user(body: web::Json<User>) -> HttpResponse {
    HttpResponse::Created().finish()
}

fn internal_helper(x: u32, y: u32) -> u32 {
    x + y
}
