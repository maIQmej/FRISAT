#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
@author: CARLOS AVILES CRUZ, 03-septiembre-2024
"""
from keras.models import load_model
from matplotlib import pyplot as plt
import numpy as np

def Normaliza(dato,mini,maxi):
    dato = (dato-mini)/(maxi-mini)
    return dato
print('Flow Regine to test')
opcion=int(input('signal to test: 1) Re85, 2)Re2148, and 3) Re34264: '))

if opcion == 1:
    file="Prueba_Re_85.csv"
elif opcion == 2:
    file="Prueba_Re_2148.csv"
elif opcion == 3:
    file="Prueba_Re_34364.csv"
    
dato = np.genfromtxt(file, delimiter=",", skip_header=True)
MaxiMini = np.load('MaxiMini.npz')
mini = MaxiMini['mini']
maxi = MaxiMini['maxi']

DB = Normaliza(dato,mini,maxi)
DB = np.moveaxis(DB, 0, -1)
DB = np.reshape(DB,(1,np.shape(DB)[0],1))
DB2 = DB[:,0:350,:]

model = load_model('Modelo_1500.h5')
result = np.argmax(model.predict(DB2))

print('Clase ganadora', result)

if result == 0:
    print("The Flow Regime is LAMINAR")
elif result == 1:
    print("The Flow Regime is TRANSITION")
elif result == 2:
    print("The Flow Regime is TURBULENT")
else:
    print("Known Flow Regime")
    

