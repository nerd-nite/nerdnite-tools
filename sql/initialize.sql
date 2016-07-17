-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema nerdnite
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `nerdnite` ;

-- -----------------------------------------------------
-- Schema nerdnite
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `nerdnite` DEFAULT CHARACTER SET utf8 ;
USE `nerdnite` ;

-- -----------------------------------------------------
-- Table `nerdnite`.`boss`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `nerdnite`.`boss` ;

CREATE TABLE IF NOT EXISTS `nerdnite`.`boss` (
  `_id` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NULL,
  PRIMARY KEY (`_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `nerdnite`.`city`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `nerdnite`.`city` ;

CREATE TABLE IF NOT EXISTS `nerdnite`.`city` (
  `_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  PRIMARY KEY (`_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `nerdnite`.`boss_city`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `nerdnite`.`boss_city` ;

CREATE TABLE IF NOT EXISTS `nerdnite`.`boss_city` (
  `boss_id` VARCHAR(255) NOT NULL,
  `city_id` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`city_id`, `boss_id`),
  INDEX `fk_boss_has_city_city1_idx` (`city_id` ASC),
  INDEX `fk_boss_has_city_boss_idx` (`boss_id` ASC),
  CONSTRAINT `fk_boss_has_city_boss`
    FOREIGN KEY (`boss_id`)
    REFERENCES `nerdnite`.`boss` (`_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_boss_has_city_city1`
    FOREIGN KEY (`city_id`)
    REFERENCES `nerdnite`.`city` (`_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `nerdnite`.`city_alias`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `nerdnite`.`city_alias` ;

CREATE TABLE IF NOT EXISTS `nerdnite`.`city_alias` (
  `alias` VARCHAR(255) NOT NULL,
  `city_id` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`alias`),
  UNIQUE INDEX `alias_UNIQUE` (`alias` ASC),
  CONSTRAINT `fk_city_alias_city1`
    FOREIGN KEY (`city_id`)
    REFERENCES `nerdnite`.`city` (`_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `nerdnite`.`boss_alias`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `nerdnite`.`boss_alias` ;

CREATE TABLE IF NOT EXISTS `nerdnite`.`boss_alias` (
  `alias` VARCHAR(255) NOT NULL,
  `boss_id` VARCHAR(255) NOT NULL,
  UNIQUE INDEX `alias_UNIQUE` (`alias` ASC),
  PRIMARY KEY (`alias`),
  CONSTRAINT `fk_boss_alias_boss1`
    FOREIGN KEY (`boss_id`)
    REFERENCES `nerdnite`.`boss` (`_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
