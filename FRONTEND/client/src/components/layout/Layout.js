'use client';

import React from 'react';
import Navbar from '../../../../../src/components/layout/Navbar';
import Sidebar from '../../../../../src/components/layout/Sidebar';
import Footer from './Footer';
import styles from '../../styles/Layout.module.css';

const Layout = ({ children }) => {
  return (
    <div className={styles.wrapper}>
      <Navbar />
      <div className={styles.mainContent}>
        <Sidebar />
        <main className={styles.content}>{children}</main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout; 