#!/bin/bash
dnf install -y postgresql17 || dnf install -y postgresql16 || dnf install -y postgresql15
