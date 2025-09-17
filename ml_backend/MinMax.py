#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Sep  2 10:36:03 2024

@author: multimedia
"""
import numpy as np



DB = np.genfromtxt("Att8_brutos1.csv", delimiter=",")
print(DB)

mini = np.amin(DB)
maxi = np.amax(DB)

np.savez('MaxiMini.npz', 
         mini = mini,
         maxi = maxi)


# In[Uso del archivo MaxiMini.npz]
MaxiMini = np.load('MaxiMini.npz')
mini = MaxiMini['mini']
maxi = MaxiMini['maxi']

print(mini, maxi)
