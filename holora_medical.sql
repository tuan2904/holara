-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: holora_medical
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_analysis_request`
--

DROP TABLE IF EXISTS `ai_analysis_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_analysis_request` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint unsigned NOT NULL,
  `consultation_image_id` bigint unsigned DEFAULT NULL,
  `requested_by` bigint unsigned DEFAULT NULL,
  `model_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_type` enum('image_analysis','symptom_analysis','risk_assessment','diagnosis_support') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `input_payload` json DEFAULT NULL,
  `status` enum('queued','processing','completed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'queued',
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `fk_ai_analysis_request_consultation_image` (`consultation_image_id`),
  KEY `fk_ai_analysis_request_requested_by` (`requested_by`),
  KEY `idx_ai_analysis_request_consultation_id` (`consultation_id`),
  KEY `idx_ai_analysis_request_status` (`status`),
  KEY `idx_ai_analysis_request_model_name` (`model_name`),
  CONSTRAINT `fk_ai_analysis_request_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_analysis_request_consultation_image` FOREIGN KEY (`consultation_image_id`) REFERENCES `consultation_image` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_analysis_request_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_analysis_request`
--

LOCK TABLES `ai_analysis_request` WRITE;
/*!40000 ALTER TABLE `ai_analysis_request` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_analysis_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_analysis_result`
--

DROP TABLE IF EXISTS `ai_analysis_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_analysis_result` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `request_id` bigint unsigned NOT NULL,
  `result_summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `result_payload` json DEFAULT NULL,
  `confidence_score` decimal(5,2) DEFAULT NULL,
  `risk_level` enum('low','medium','high','critical') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recommendation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reviewed_by_doctor_id` bigint unsigned DEFAULT NULL,
  `doctor_review_status` enum('pending_review','approved','approved_watch','not_standard','revoked') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_review',
  `shared_with_patient` tinyint(1) NOT NULL DEFAULT '0',
  `review_note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ai_analysis_result_request_id` (`request_id`),
  KEY `idx_ai_analysis_result_risk_level` (`risk_level`),
  KEY `idx_ai_analysis_result_reviewed_by_doctor_id` (`reviewed_by_doctor_id`),
  CONSTRAINT `fk_ai_analysis_result_request` FOREIGN KEY (`request_id`) REFERENCES `ai_analysis_request` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_analysis_result_reviewed_by_doctor` FOREIGN KEY (`reviewed_by_doctor_id`) REFERENCES `doctor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_analysis_result`
--

LOCK TABLES `ai_analysis_result` WRITE;
/*!40000 ALTER TABLE `ai_analysis_result` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_analysis_result` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointment`
--

DROP TABLE IF EXISTS `appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `specialty_id` bigint unsigned DEFAULT NULL,
  `branch_id` bigint unsigned DEFAULT NULL,
  `recurring_id` bigint unsigned DEFAULT NULL,
  `appointment_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointment_date` date NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `appointment_type` enum('online','offline','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'online',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('scheduled','confirmed','checked_in','in_progress','completed','cancelled','no_show') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `cancellation_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `appointment_code` (`appointment_code`),
  KEY `fk_appointment_created_by` (`created_by`),
  KEY `idx_appointment_patient_id` (`patient_id`),
  KEY `idx_appointment_doctor_id` (`doctor_id`),
  KEY `idx_appointment_specialty_id` (`specialty_id`),
  KEY `idx_appointment_date` (`appointment_date`),
  KEY `idx_appointment_status` (`status`),
  KEY `idx_appointment_start_time` (`start_time`),
  KEY `idx_appointment_branch_id` (`branch_id`),
  KEY `idx_appointment_recurring_id` (`recurring_id`),
  CONSTRAINT `fk_appointment_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appointment_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_appointment_recurring` FOREIGN KEY (`recurring_id`) REFERENCES `recurring_appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appointment_specialty` FOREIGN KEY (`specialty_id`) REFERENCES `specialty` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment`
--

LOCK TABLES `appointment` WRITE;
/*!40000 ALTER TABLE `appointment` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` bigint unsigned DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_log_user_id` (`user_id`),
  KEY `idx_audit_log_action` (`action`),
  KEY `idx_audit_log_module_name` (`module_name`),
  KEY `idx_audit_log_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_log_created_at` (`created_at`),
  CONSTRAINT `fk_audit_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` bigint unsigned DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branch`
--

DROP TABLE IF EXISTS `branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branch` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_user_id` bigint unsigned DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_branch_code` (`code`),
  KEY `idx_branch_status` (`status`),
  KEY `idx_branch_deleted_at` (`deleted_at`),
  KEY `idx_branch_owner_user` (`owner_user_id`),
  CONSTRAINT `fk_branch_owner_user` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branch`
--

LOCK TABLES `branch` WRITE;
/*!40000 ALTER TABLE `branch` DISABLE KEYS */;
/*!40000 ALTER TABLE `branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation`
--

DROP TABLE IF EXISTS `consultation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned DEFAULT NULL,
  `appointment_id` bigint unsigned DEFAULT NULL,
  `consultation_type` enum('text','image','video','hybrid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `chief_complaint` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `symptoms` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','in_progress','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `priority` enum('low','normal','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consultation_patient_id` (`patient_id`),
  KEY `idx_consultation_doctor_id` (`doctor_id`),
  KEY `idx_consultation_status` (`status`),
  KEY `idx_consultation_priority` (`priority`),
  KEY `idx_consultation_created_at` (`created_at`),
  KEY `fk_consultation_appointment` (`appointment_id`),
  CONSTRAINT `fk_consultation_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_consultation_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_consultation_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation`
--

LOCK TABLES `consultation` WRITE;
/*!40000 ALTER TABLE `consultation` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_image`
--

DROP TABLE IF EXISTS `consultation_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_image` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint unsigned NOT NULL,
  `uploaded_by` bigint unsigned DEFAULT NULL,
  `response_id` bigint unsigned DEFAULT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_type` enum('symptom','lab_report','xray','prescription','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `caption` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_consultation_image_uploaded_by` (`uploaded_by`),
  KEY `idx_consultation_image_response_id` (`response_id`),
  KEY `idx_consultation_image_consultation_id` (`consultation_id`),
  KEY `idx_consultation_image_type` (`image_type`),
  CONSTRAINT `fk_consultation_image_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_consultation_image_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_image`
--

LOCK TABLES `consultation_image` WRITE;
/*!40000 ALTER TABLE `consultation_image` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation_image` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultation_response`
--
--

DROP TABLE IF EXISTS `consultation_response`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_response` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint unsigned NOT NULL,
  `responder_user_id` bigint unsigned NOT NULL,
  `response_type` enum('message','diagnosis','recommendation','prescription_note','follow_up') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'message',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_from_ai` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consultation_response_consultation_id` (`consultation_id`),
  KEY `idx_consultation_response_responder_user_id` (`responder_user_id`),
  KEY `idx_consultation_response_type` (`response_type`),
  CONSTRAINT `fk_consultation_response_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_consultation_response_responder` FOREIGN KEY (`responder_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultation_response`
--

LOCK TABLES `consultation_response` WRITE;
/*!40000 ALTER TABLE `consultation_response` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultation_response` ENABLE KEYS */;
UNLOCK TABLES;

ALTER TABLE `consultation_image` ADD CONSTRAINT `fk_consultation_image_response` FOREIGN KEY (`response_id`) REFERENCES `consultation_response` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Table structure for table `doctor`
--

DROP TABLE IF EXISTS `doctor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `created_by_user_id` bigint unsigned DEFAULT NULL,
  `specialty_id` bigint unsigned DEFAULT NULL,
  `doctor_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qualification` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `experience_years` int unsigned NOT NULL DEFAULT '0',
  `consultation_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `avatar_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','on_leave','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `doctor_code` (`doctor_code`),
  UNIQUE KEY `uk_doctor_code` (`doctor_code`),
  UNIQUE KEY `uk_license_number` (`license_number`),
  KEY `fk_doctor_user` (`user_id`),
  KEY `idx_doctor_specialty_id` (`specialty_id`),
  KEY `idx_doctor_full_name` (`full_name`),
  KEY `idx_doctor_status` (`status`),
  KEY `idx_doctor_license_number` (`license_number`),
  KEY `idx_doctor_code` (`doctor_code`),
  KEY `idx_doctor_created_by_user` (`created_by_user_id`),
  CONSTRAINT `fk_doctor_created_by_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_doctor_specialty` FOREIGN KEY (`specialty_id`) REFERENCES `specialty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_doctor_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor`
--

LOCK TABLES `doctor` WRITE;
/*!40000 ALTER TABLE `doctor` DISABLE KEYS */;
/*!40000 ALTER TABLE `doctor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_branch`
--

DROP TABLE IF EXISTS `doctor_branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_branch` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `doctor_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_doctor_branch` (`doctor_id`,`branch_id`),
  KEY `idx_doctor_branch_doctor` (`doctor_id`),
  KEY `idx_doctor_branch_branch` (`branch_id`),
  KEY `idx_doctor_branch_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_doctor_branch_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doctor_branch_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_branch`
--

LOCK TABLES `doctor_branch` WRITE;
/*!40000 ALTER TABLE `doctor_branch` DISABLE KEYS */;
/*!40000 ALTER TABLE `doctor_branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_invite`
--

DROP TABLE IF EXISTS `doctor_invite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_invite` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_by_user_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_doctor_invite_token_hash` (`token_hash`),
  KEY `idx_doctor_invite_user` (`user_id`),
  KEY `idx_doctor_invite_doctor` (`doctor_id`),
  KEY `idx_doctor_invite_email` (`email`),
  KEY `idx_doctor_invite_expiry` (`expires_at`),
  KEY `fk_doctor_invite_creator` (`created_by_user_id`),
  CONSTRAINT `fk_doctor_invite_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_doctor_invite_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doctor_invite_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_invite`
--

LOCK TABLES `doctor_invite` WRITE;
/*!40000 ALTER TABLE `doctor_invite` DISABLE KEYS */;
/*!40000 ALTER TABLE `doctor_invite` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_schedule`
--

DROP TABLE IF EXISTS `doctor_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_schedule` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `doctor_id` bigint unsigned NOT NULL,
  `work_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `slot_duration` int NOT NULL DEFAULT '30',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `doctor_schedule_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_schedule`
--

LOCK TABLES `doctor_schedule` WRITE;
/*!40000 ALTER TABLE `doctor_schedule` DISABLE KEYS */;
/*!40000 ALTER TABLE `doctor_schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holora_mind_chats`
--

DROP TABLE IF EXISTS `holora_mind_chats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holora_mind_chats` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Cu�?�c tr?? chuy�?�n m�?�i',
  `model_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'HoloraMind-v1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_holora_mind_chat_user` (`user_id`),
  CONSTRAINT `fk_holora_mind_chat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holora_mind_chats`
--

LOCK TABLES `holora_mind_chats` WRITE;
/*!40000 ALTER TABLE `holora_mind_chats` DISABLE KEYS */;
/*!40000 ALTER TABLE `holora_mind_chats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holora_mind_messages`
--

DROP TABLE IF EXISTS `holora_mind_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holora_mind_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `chat_id` bigint unsigned NOT NULL,
  `role` enum('user','assistant') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_holora_mind_msg_chat` (`chat_id`),
  CONSTRAINT `fk_holora_mind_msg_chat` FOREIGN KEY (`chat_id`) REFERENCES `holora_mind_chats` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holora_mind_messages`
--

LOCK TABLES `holora_mind_messages` WRITE;
/*!40000 ALTER TABLE `holora_mind_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `holora_mind_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `notification_type` enum('system','appointment','consultation','video','billing','review','security') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `reference_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint unsigned DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notification_user_id` (`user_id`),
  KEY `idx_notification_type` (`notification_type`),
  KEY `idx_notification_is_read` (`is_read`),
  KEY `idx_notification_reference` (`reference_type`,`reference_id`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient`
--

DROP TABLE IF EXISTS `patient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `patient_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blood_group` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allergies` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `medical_history` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `emergency_contact_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','blocked') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patient_code` (`patient_code`),
  UNIQUE KEY `uk_patient_code` (`patient_code`),
  KEY `fk_patient_user` (`user_id`),
  KEY `idx_patient_full_name` (`full_name`),
  KEY `idx_patient_phone` (`phone`),
  KEY `idx_patient_email` (`email`),
  KEY `idx_patient_status` (`status`),
  KEY `idx_patient_code` (`patient_code`),
  KEY `idx_patient_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_patient_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient`
--

LOCK TABLES `patient` WRITE;
/*!40000 ALTER TABLE `patient` DISABLE KEYS */;
/*!40000 ALTER TABLE `patient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_branch`
--

DROP TABLE IF EXISTS `patient_branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_branch` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_patient_branch` (`patient_id`,`branch_id`),
  KEY `idx_patient_branch_patient` (`patient_id`),
  KEY `idx_patient_branch_branch` (`branch_id`),
  KEY `idx_patient_branch_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_patient_branch_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_patient_branch_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_branch`
--

LOCK TABLES `patient_branch` WRITE;
/*!40000 ALTER TABLE `patient_branch` DISABLE KEYS */;
/*!40000 ALTER TABLE `patient_branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `doctor_id` bigint unsigned NOT NULL,
  `appointment_id` bigint unsigned DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(8) DEFAULT 'VND',
  `type` varchar(32) DEFAULT 'consultation',
  `status` varchar(16) DEFAULT 'paid',
  `note` varchar(255) DEFAULT NULL,
  `paid_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `appointment_id` (`appointment_id`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payment_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_order`
--

DROP TABLE IF EXISTS `payment_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_order` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `plan_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'account',
  `months` tinyint unsigned NOT NULL DEFAULT '1',
  `amount_cents` int unsigned NOT NULL,
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `payment_method` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','paid','failed','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_token` (`token`),
  UNIQUE KEY `uq_invoice_number` (`invoice_number`),
  KEY `idx_user_status` (`user_id`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_order`
--

LOCK TABLES `payment_order` WRITE;
/*!40000 ALTER TABLE `payment_order` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission`
--

DROP TABLE IF EXISTS `permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_permission_module` (`module_name`),
  KEY `idx_permission_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission`
--

LOCK TABLES `permission` WRITE;
/*!40000 ALTER TABLE `permission` DISABLE KEYS */;
INSERT INTO `permission` VALUES (1,'Manage Users','user.manage','user','To?�n quy�?�n qu�?�n l?? ng??�?�i d??ng','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(2,'Manage Roles','role.manage','rbac','To?�n quy�?�n qu�?�n l?? vai tr??','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(3,'Manage Permissions','permission.manage','rbac','To?�n quy�?�n qu�?�n l?? ph?�n quy�?�n','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(4,'Manage Patients','patient.manage','patient','To?�n quy�?�n qu�?�n l?? b�?�nh nh?�n','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(5,'Manage Doctors','doctor.manage','doctor','To?�n quy�?�n qu�?�n l?? b?�c s??','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(6,'Manage Consultations','consultation.manage','consultation','To?�n quy�?�n qu�?�n l?? ca t?? v�?�n','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(7,'Manage AI Analysis','ai.manage','ai','To?�n quy�?�n qu�?�n l?? ph?�n t?�ch AI','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(8,'Manage Appointments','appointment.manage','appointment','To?�n quy�?�n qu�?�n l?? l�?�ch h�??n','active','2026-03-28 09:52:25','2026-04-03 02:11:42'),(9,'Manage Video Sessions','video.manage','video','Qu�?�n l?? phi?�n t?? v�?�n video','active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(10,'Manage Reviews','review.manage','review','Qu�?�n l?? ?�?�nh gi?�','active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(11,'Manage Notifications','notification.manage','notification','Qu�?�n l?? th??ng b?�o','active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(12,'View Audit Logs','audit.view','audit','Xem nh�?�t k?? h�?� th�?�ng','active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(13,'Access Dashboard','dashboard.access','dashboard','Truy c�?�p b�?�ng ?�i�?�u khi�?�n t�?�ng quan','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(14,'View Users','user.view','user','Xem danh s?�ch v?� th??ng tin ng??�?�i d??ng','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(15,'Create User','user.create','user','T�?�o t?�i kho�?�n ng??�?�i d??ng m�?�i','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(16,'Update User','user.update','user','C�?�p nh�?�t th??ng tin ng??�?�i d??ng','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(17,'Delete User','user.delete','user','X??a t?�i kho�?�n ng??�?�i d??ng','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(18,'View Patients','patient.view','patient','Xem danh s?�ch v?� h�?� s?� b�?�nh nh?�n','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(19,'Create Patient','patient.create','patient','Th?�m h�?� s?� b�?�nh nh?�n m�?�i','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(20,'Update Patient','patient.update','patient','C�?�p nh�?�t h�?� s?� b�?�nh nh?�n','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(21,'View Appointments','appointment.view','appointment','Xem l�?�ch h�??n c�?�a m?�nh','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(22,'Create Appointment','appointment.create','appointment','?��??t l�?�ch h�??n m�?�i','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(23,'Update Appointment Status','appointment.update','appointment','C�?�p nh�?�t tr�?�ng th?�i l�?�ch h�??n','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(24,'View Consultations','consultation.view','consultation','Xem ca t?? v�?�n c�?�a m?�nh','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(25,'Respond to Consultation','consultation.respond','consultation','Ph�?�n h�?�i / ch�??n ?�o?�n ca t?? v�?�n','active','2026-03-28 14:55:40','2026-04-03 02:11:42'),(26,'View Analytics','dashboard.analytics','dashboard','Xem b?�o c?�o th�?�ng k?� ph?�n t?�ch','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(27,'Assign Role to User','user.assign_role','user','G?�n ho�??c g�?� vai tr?? kh�?�i ng??�?�i d??ng','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(28,'View Roles','role.view','rbac','Xem danh s?�ch vai tr??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(29,'Create Role','role.create','rbac','T�?�o vai tr?? m�?�i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(30,'Update Role','role.update','rbac','C�?�p nh�?�t vai tr??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(31,'Delete Role','role.delete','rbac','X??a vai tr??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(32,'View Permissions','permission.view','rbac','Xem danh s?�ch ph?�n quy�?�n','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(33,'Create Permission','permission.create','rbac','T�?�o ph?�n quy�?�n m�?�i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(34,'Update Permission','permission.update','rbac','C�?�p nh�?�t ph?�n quy�?�n','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(35,'Delete Permission','permission.delete','rbac','X??a ph?�n quy�?�n','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(36,'Delete Patient','patient.delete','patient','X??a h�?� s?� b�?�nh nh?�n','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(37,'View Doctors','doctor.view','doctor','Xem danh s?�ch v?� h�?� s?� b?�c s??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(38,'Create Doctor','doctor.create','doctor','Th?�m h�?� s?� b?�c s?? m�?�i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(39,'Update Doctor','doctor.update','doctor','C�?�p nh�?�t h�?� s?� b?�c s??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(40,'Delete Doctor','doctor.delete','doctor','X??a h�?� s?� b?�c s??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(41,'Manage Branches','branch.manage','branch','To?�n quy�?�n qu�?�n l?? chi nh?�nh','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(42,'View Branches','branch.view','branch','Xem danh s?�ch v?� th??ng tin chi nh?�nh','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(43,'Create Branch','branch.create','branch','Th?�m chi nh?�nh m�?�i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(44,'Update Branch','branch.update','branch','C�?�p nh�?�t th??ng tin chi nh?�nh','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(45,'Delete Branch','branch.delete','branch','X??a chi nh?�nh','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(46,'View All Appointments','appointment.admin','appointment','Xem t�?�t c�?� l�?�ch h�??n trong h�?� th�?�ng (admin)','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(47,'Delete Appointment','appointment.delete','appointment','H�?�y / x??a l�?�ch h�??n','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(48,'Create Consultation','consultation.create','consultation','G�?�i y?�u c�?�u t?? v�?�n m�?�i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(49,'Reopen Consultation','consultation.reopen','consultation','M�?f l�?�i ca t?? v�?�n ?�?� ho?�n th?�nh','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(50,'View Schedules','schedule.view','schedule','Xem l�?�ch l?�m vi�?�c c�?�a b?�c s??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(51,'Create Schedule','schedule.create','schedule','T�?�o ca l?�m vi�?�c m�?�i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(52,'Update Schedule','schedule.update','schedule','C�?�p nh�?�t ca l?�m vi�?�c','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(53,'Delete Schedule','schedule.delete','schedule','X??a ca l?�m vi�?�c','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(54,'View Specialties','specialty.view','specialty','Xem danh m�?�c chuy?�n khoa','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(55,'Create Specialty','specialty.create','specialty','Th?�m chuy?�n khoa m�?�i','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(56,'Update Specialty','specialty.update','specialty','C�?�p nh�?�t chuy?�n khoa','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(57,'Delete Specialty','specialty.delete','specialty','X??a chuy?�n khoa','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(58,'Request AI Analysis','ai.analyze','ai','G�?�i y?�u c�?�u AI ph?�n t?�ch �?�nh ca kh?�m','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(59,'View AI Results','ai.view','ai','Xem k�??t qu�?� ph?�n t?�ch AI','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(60,'Review AI Results','ai.review','ai','B?�c s?? ?�?�nh gi?� v?� ki�?�m so?�t k�??t qu�?� AI','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(61,'View Subscriptions','subscription.view','subscription','Xem g??i d�?�ch v�?� v?� tr�?�ng th?�i ?�?�ng k??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(62,'Activate Subscription','subscription.activate','subscription','K?�ch ho�?�t g??i d�?�ch v�?�','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(63,'Manage Subscriptions','subscription.manage','subscription','Qu�?�n l?? thanh to?�n v?� x?�c nh�?�n ?�?�ng k??','active','2026-04-03 02:11:42','2026-04-03 02:11:42'),(64,'Upload Files','upload.file','upload','T�?�i �?�nh / t�?�p ?�?�nh k?�m l?�n h�?� th�?�ng','active','2026-04-03 02:11:42','2026-04-03 02:11:42');
/*!40000 ALTER TABLE `permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescription`
--

DROP TABLE IF EXISTS `prescription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescription` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint unsigned DEFAULT NULL,
  `appointment_id` bigint unsigned DEFAULT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `patient_id` bigint unsigned NOT NULL,
  `prescription_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `diagnosis` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','issued','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `issued_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_prescription_code` (`prescription_code`),
  KEY `idx_prescription_consultation` (`consultation_id`),
  KEY `idx_prescription_appointment` (`appointment_id`),
  KEY `idx_prescription_doctor` (`doctor_id`),
  KEY `idx_prescription_patient` (`patient_id`),
  KEY `idx_prescription_status` (`status`),
  CONSTRAINT `fk_prescription_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prescription_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prescription_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prescription_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription`
--

LOCK TABLES `prescription` WRITE;
/*!40000 ALTER TABLE `prescription` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescription_item`
--

DROP TABLE IF EXISTS `prescription_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescription_item` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `prescription_id` bigint unsigned NOT NULL,
  `medication_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dosage` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `frequency` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int unsigned DEFAULT NULL,
  `unit` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instructions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_item_prescription` (`prescription_id`),
  CONSTRAINT `fk_item_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescription` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription_item`
--

LOCK TABLES `prescription_item` WRITE;
/*!40000 ALTER TABLE `prescription_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescription_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provider_subscription`
--

DROP TABLE IF EXISTS `provider_subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provider_subscription` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plan_id` bigint unsigned NOT NULL,
  `scope_type` enum('doctor','branch','account') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_id` bigint unsigned NOT NULL,
  `owner_user_id` bigint unsigned NOT NULL,
  `status` enum('trialing','active','past_due','cancelled','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'trialing',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime DEFAULT NULL,
  `trial_ends_at` datetime DEFAULT NULL,
  `auto_renew` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_provider_subscription_scope` (`scope_type`,`scope_id`),
  KEY `idx_provider_subscription_owner` (`owner_user_id`),
  KEY `idx_provider_subscription_status` (`status`),
  KEY `idx_provider_subscription_deleted` (`deleted_at`),
  KEY `fk_provider_subscription_plan` (`plan_id`),
  CONSTRAINT `fk_provider_subscription_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_provider_subscription_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plan` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provider_subscription`
--

LOCK TABLES `provider_subscription` WRITE;
/*!40000 ALTER TABLE `provider_subscription` DISABLE KEYS */;
/*!40000 ALTER TABLE `provider_subscription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurring_appointments`
--

DROP TABLE IF EXISTS `recurring_appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recurring_appointments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned NOT NULL,
  `repeat_type` enum('daily','weekly','monthly') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `repeat_interval` int unsigned DEFAULT '1',
  `repeat_days` json DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recurring_patient` (`patient_id`),
  KEY `idx_recurring_doctor` (`doctor_id`),
  KEY `idx_recurring_branch` (`branch_id`),
  CONSTRAINT `fk_recurring_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recurring_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recurring_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurring_appointments`
--

LOCK TABLES `recurring_appointments` WRITE;
/*!40000 ALTER TABLE `recurring_appointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `recurring_appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` datetime DEFAULT NULL,
  `replaced_by_hash` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rt_token_hash` (`token_hash`),
  KEY `idx_rt_user_id` (`user_id`),
  KEY `idx_rt_expires` (`expires_at`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review`
--

DROP TABLE IF EXISTS `review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `appointment_id` bigint unsigned DEFAULT NULL,
  `rating` tinyint unsigned NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('pending','approved','rejected','hidden') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_review_patient_id` (`patient_id`),
  KEY `idx_review_doctor_id` (`doctor_id`),
  KEY `idx_review_appointment_id` (`appointment_id`),
  KEY `idx_review_status` (`status`),
  KEY `idx_review_rating` (`rating`),
  CONSTRAINT `fk_review_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_review_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctor` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_review_patient` FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review`
--

LOCK TABLES `review` WRITE;
/*!40000 ALTER TABLE `review` DISABLE KEYS */;
/*!40000 ALTER TABLE `review` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_system_role` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_role_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES (1,'Super Admin','super_admin','To?�n quy�?�n h�?� th�?�ng',1,'active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(2,'Admin','admin','Qu�?�n tr�?� h�?� th�?�ng',1,'active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(3,'Doctor','doctor','B?�c s??',1,'active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(4,'Patient','patient','B�?�nh nh?�n',1,'active','2026-03-28 09:52:25','2026-03-28 09:52:25'),(5,'Clinic Owner','clinic_owner','Owner of clinic/provider account',0,'active','2026-03-30 04:20:47','2026-04-06 03:27:31'),(6,'Branch Manager','branch_manager','Manager of a specific branch',0,'active','2026-03-30 04:20:47','2026-04-06 03:27:31');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permission`
--

DROP TABLE IF EXISTS `role_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permission` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  `granted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `granted_by` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`),
  KEY `fk_role_permission_granted_by` (`granted_by`),
  KEY `idx_role_permission_permission_id` (`permission_id`),
  CONSTRAINT `fk_role_permission_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permission` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permission`
--

LOCK TABLES `role_permission` WRITE;
/*!40000 ALTER TABLE `role_permission` DISABLE KEYS */;
INSERT INTO `role_permission` VALUES (1,1,1,'2026-03-28 14:55:55',NULL),(2,1,2,'2026-03-28 14:55:55',NULL),(3,1,3,'2026-03-28 14:55:55',NULL),(4,1,4,'2026-03-28 14:55:55',NULL),(5,1,5,'2026-03-28 14:55:55',NULL),(6,1,6,'2026-03-28 14:55:55',NULL),(7,1,7,'2026-03-28 14:55:55',NULL),(8,1,8,'2026-03-28 14:55:55',NULL),(9,1,9,'2026-03-28 14:55:55',NULL),(10,1,10,'2026-03-28 14:55:55',NULL),(11,1,11,'2026-03-28 14:55:55',NULL),(12,1,12,'2026-03-28 14:55:55',NULL),(13,1,13,'2026-03-28 14:55:55',NULL),(14,1,14,'2026-03-28 14:55:55',NULL),(15,1,15,'2026-03-28 14:55:55',NULL),(16,1,16,'2026-03-28 14:55:55',NULL),(17,1,17,'2026-03-28 14:55:55',NULL),(18,1,18,'2026-03-28 14:55:55',NULL),(19,1,19,'2026-03-28 14:55:55',NULL),(20,1,20,'2026-03-28 14:55:55',NULL),(21,1,21,'2026-03-28 14:55:55',NULL),(22,1,22,'2026-03-28 14:55:55',NULL),(23,1,23,'2026-03-28 14:55:55',NULL),(24,1,24,'2026-03-28 14:55:55',NULL),(25,1,25,'2026-03-28 14:55:55',NULL),(32,2,22,'2026-03-28 14:56:13',NULL),(33,2,23,'2026-03-28 14:56:13',NULL),(34,2,21,'2026-03-28 14:56:13',NULL),(35,2,24,'2026-03-28 14:56:13',NULL),(36,2,13,'2026-03-28 14:56:13',NULL),(37,2,19,'2026-03-28 14:56:13',NULL),(38,2,20,'2026-03-28 14:56:13',NULL),(39,2,18,'2026-03-28 14:56:13',NULL),(40,2,15,'2026-03-28 14:56:13',NULL),(41,2,16,'2026-03-28 14:56:13',NULL),(42,2,14,'2026-03-28 14:56:13',NULL),(47,3,23,'2026-03-28 14:56:28',NULL),(48,3,21,'2026-03-28 14:56:28',NULL),(49,3,25,'2026-03-28 14:56:28',NULL),(50,3,24,'2026-03-28 14:56:28',NULL),(51,3,13,'2026-03-28 14:56:28',NULL),(52,3,18,'2026-03-28 14:56:28',NULL),(54,4,22,'2026-03-28 14:56:46',NULL),(55,4,21,'2026-03-28 14:56:46',NULL);
/*!40000 ALTER TABLE `role_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `specialty`
--

DROP TABLE IF EXISTS `specialty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `specialty` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `doctor_count` int unsigned DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `uk_specialty_code` (`code`),
  KEY `idx_specialty_code` (`code`),
  KEY `idx_specialty_status` (`status`),
  KEY `idx_specialty_deleted_at` (`deleted_at`),
  KEY `idx_specialty_parent_id` (`parent_id`),
  CONSTRAINT `fk_specialty_parent` FOREIGN KEY (`parent_id`) REFERENCES `specialty` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `specialty`
--

LOCK TABLES `specialty` WRITE;
/*!40000 ALTER TABLE `specialty` DISABLE KEYS */;
INSERT INTO `specialty` VALUES (1,'R?�ng H?�m M�??t','S000001',NULL,'R?�ng H?�m M�??t','active','2026-03-29 05:33:04','2026-04-06 03:23:58',NULL,3),(2,'N�?�i khoa','INTERNAL_MEDICINE',NULL,'?�i�?�u tr�?� b�?�nh b�??ng thu�?�c','active','2026-03-30 07:08:37','2026-04-06 03:27:32',NULL,0),(3,'Ngo�?�i khoa','SURGERY',NULL,'?�i�?�u tr�?� b�?�nh b�??ng ph�?�u thu�?�t','active','2026-03-30 07:08:57','2026-04-06 03:27:32',NULL,0),(4,'S�?�n ph�?� khoa','S000004',NULL,'S�?�n ph�?� khoa','active','2026-03-30 07:09:16','2026-03-30 07:09:16',NULL,0),(5,'Nhi khoa','S000005',NULL,'Nhi khoa','active','2026-03-30 07:09:37','2026-03-30 07:09:37',NULL,0),(6,'Y t�?? c??ng c�?�ng/Y h�?�c d�?? ph??ng','S000006',NULL,'Y t�?? c??ng c�?�ng/Y h�?�c d�?? ph??ng','active','2026-03-30 07:10:14','2026-03-30 07:10:14',NULL,0),(7,'D??�?�c h�?�c','S000007',NULL,'D??�?�c h�?�c','active','2026-03-30 07:10:31','2026-03-30 07:10:31',NULL,0),(8,'?�i�?�u d??�?�ng/H�?� sinh','S000008',NULL,'?�i�?�u d??�?�ng/H�?� sinh','active','2026-03-30 07:10:46','2026-03-30 07:10:46',NULL,0),(9,'Chuy?�n khoa gi?�c quan/da','S000009',NULL,'Chuy?�n khoa gi?�c quan/da','active','2026-03-30 07:11:10','2026-03-30 07:11:10',NULL,0),(10,'Chuy?�n khoa ch�??c n?�ng/h�?� tr�?�','S000010',NULL,'Chuy?�n khoa ch�??c n?�ng/h�?� tr�?�','active','2026-03-30 07:11:29','2026-04-06 03:23:58',NULL,1),(11,'Chuy?�n khoa ?��??c th??','S000011',NULL,'Chuy?�n khoa ?��??c th??','active','2026-03-30 07:11:44','2026-03-30 07:11:44',NULL,0),(13,'Tim m�?�ch','CARDIOLOGY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(14,'Ti?�u h??a','GASTROENTEROLOGY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(15,'H?? h�?�p','RESPIRATORY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(16,'N�?�i ti�??t','ENDOCRINOLOGY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(17,'Th�?�n - Ti�??t ni�?�u','NEPHRO_UROLOGY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(18,'X???�ng kh�?�p','RHEUMATOLOGY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(19,'Huy�??t h�?�c','HEMATOLOGY',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(20,'Truy�?�n nhi�?�m/Nhi�?�t ?��?�i','INFECTIOUS_DISEASE',2,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(21,'Ngo�?�i t�?�ng qu?�t','GENERAL_SURGERY',3,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(22,'Ngo�?�i th�?�n kinh','NEUROSURGERY',3,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(23,'Ngo�?�i l�?�ng ng�??c','THORACIC_SURGERY',3,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0),(24,'Ch�?�n th???�ng ch�?�nh h?�nh','ORTHOPEDIC_TRAUMA',3,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,1),(25,'Ngo�?�i nhi','PEDIATRIC_SURGERY',3,NULL,'active','2026-03-30 07:16:17','2026-04-06 03:27:32',NULL,0);
/*!40000 ALTER TABLE `specialty` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_entitlement`
--

DROP TABLE IF EXISTS `subscription_entitlement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_entitlement` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plan_id` bigint unsigned NOT NULL,
  `feature_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `limit_value` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plan_feature` (`plan_id`,`feature_code`),
  KEY `idx_entitlement_feature` (`feature_code`),
  CONSTRAINT `fk_entitlement_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_entitlement`
--

LOCK TABLES `subscription_entitlement` WRITE;
/*!40000 ALTER TABLE `subscription_entitlement` DISABLE KEYS */;
INSERT INTO `subscription_entitlement` VALUES (1,4,'branch.manage',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(2,3,'branch.manage',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(3,2,'branch.manage',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(4,1,'branch.manage',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(8,4,'doctor.manage',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(9,3,'doctor.manage',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(10,2,'doctor.manage',1,3,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(11,1,'doctor.manage',1,1,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(15,4,'appointment.receive',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(16,3,'appointment.receive',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(17,2,'appointment.receive',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(18,1,'appointment.receive',1,NULL,'2026-03-30 03:24:55','2026-04-06 03:27:33'),(25,9,'branch.manage',1,3,'2026-03-30 09:04:45','2026-04-06 03:27:33'),(26,9,'doctor.manage',1,3,'2026-03-30 09:04:45','2026-04-06 03:27:33'),(27,10,'branch.manage',1,NULL,'2026-03-30 09:04:45','2026-04-06 03:27:33'),(28,10,'doctor.manage',1,NULL,'2026-03-30 09:04:45','2026-04-06 03:27:33');
/*!40000 ALTER TABLE `subscription_entitlement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plan`
--

DROP TABLE IF EXISTS `subscription_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_plan` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_type` enum('doctor','branch','account') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `billing_cycle` enum('monthly','yearly') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  `price_cents` int unsigned NOT NULL DEFAULT '0',
  `currency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subscription_plan_code` (`code`),
  KEY `idx_subscription_plan_scope` (`scope_type`),
  KEY `idx_subscription_plan_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plan`
--

LOCK TABLES `subscription_plan` WRITE;
/*!40000 ALTER TABLE `subscription_plan` DISABLE KEYS */;
INSERT INTO `subscription_plan` VALUES (1,'DOCTOR_TRIAL_14D','Doctor Trial 14 Days','doctor','monthly',0,'VND','active','2026-03-30 03:24:55','2026-04-06 03:27:33',NULL),(2,'DOCTOR_PRO_MONTHLY','Doctor Pro Monthly','doctor','monthly',299000,'VND','active','2026-03-30 03:24:55','2026-04-06 03:27:33',NULL),(3,'BRANCH_TRIAL_30D','Branch Trial 30 Days','branch','monthly',0,'VND','active','2026-03-30 03:24:55','2026-04-06 03:27:33',NULL),(4,'BRANCH_GROWTH_MONTHLY','Branch Growth Monthly','branch','monthly',999000,'VND','active','2026-03-30 03:24:55','2026-04-06 03:27:33',NULL),(9,'HOLORA_FREE','MeDecode Free','account','monthly',0,'VND','active','2026-03-30 09:04:45','2026-04-06 03:27:33',NULL),(10,'HOLORA_PLUS','MeDecode Plus','account','monthly',299000,'VND','active','2026-03-30 09:04:45','2026-04-06 03:27:33',NULL);
/*!40000 ALTER TABLE `subscription_plan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_role`
--

DROP TABLE IF EXISTS `user_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_role` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  KEY `fk_user_role_assigned_by` (`assigned_by`),
  KEY `idx_user_role_role_id` (`role_id`),
  CONSTRAINT `fk_user_role_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_role`
--

LOCK TABLES `user_role` WRITE;
/*!40000 ALTER TABLE `user_role` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth_provider` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'local',
  `google_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `status` enum('active','inactive','suspended','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `email_verified_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `remember_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_user_full_name` (`full_name`),
  KEY `idx_user_phone` (`phone`),
  KEY `idx_user_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_consultation_session`
--

DROP TABLE IF EXISTS `video_consultation_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_consultation_session` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `appointment_id` bigint unsigned NOT NULL,
  `consultation_id` bigint unsigned DEFAULT NULL,
  `room_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` enum('agora','twilio','google_meet','zoom','custom_webrtc') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'custom_webrtc',
  `session_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `join_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `duration_minutes` int unsigned DEFAULT NULL,
  `status` enum('scheduled','live','ended','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `recording_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `room_code` (`room_code`),
  KEY `idx_video_session_appointment_id` (`appointment_id`),
  KEY `idx_video_session_consultation_id` (`consultation_id`),
  KEY `idx_video_session_status` (`status`),
  CONSTRAINT `fk_video_session_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_video_session_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultation` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_consultation_session`
--

LOCK TABLES `video_consultation_session` WRITE;
/*!40000 ALTER TABLE `video_consultation_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `video_consultation_session` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-06 12:21:00
