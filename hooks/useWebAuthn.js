"use client";

import { client } from "@passwordless-id/webauthn";
import { authenticatorMetadata } from "./authenticatorMetadata";
import { ethers } from "ethers";

export default function useWebAuthn() {
  const register = async (id) => {
    const challenge =
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    const registration = await client.register(id, challenge, {
      authenticatorType: "auto",
      userVerification: "discouraged",
      timeout: 60000,
      attestation: true,
      debug: false,
    });

    console.log(registration);
    const authenticatorData = registration.authenticatorData;
    const credentialId = registration.credential.id;

    var encoder = new TextEncoder();

    const parsedAuthData = parseAuthData(
      encoder.encode(authenticatorData).buffer
    );

    console.log(parsedAuthData);

    const aaguid = parsedAuthData.aaguid;
    const rpIdHash = parsedAuthData.rpIdHash;

    console.log(aaguid.split("-")[0]);
    const aaguidBuffer = encoder.encode(aaguid.split("-")[0]).buffer;
    const rpIdHashBuffer = encoder.encode(rpIdHash).buffer;

    const addedBuffer = concatenateBuffers(aaguidBuffer, rpIdHashBuffer);
    const BufferHex = bufferToHex(addedBuffer);

    const credentialIdHex = ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes(credentialId)
    );

    const sha256BufferHex = ethers.utils.sha256(
      ethers.utils.arrayify("0x" + BufferHex)
    );

    const concatenatedHex = sha256BufferHex + credentialIdHex.slice(2);

    const finalHash = ethers.utils.sha256(
      ethers.utils.arrayify(concatenatedHex)
    );
    console.log(finalHash);
  };

  const login = async () => {
    const challenge =
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    const authentication = await client.authenticate([], challenge, {
      authenticatorType: "auto",
      userVerification: "required",
      timeout: 60000,
    });

    console.log(authentication);

    const authData = authentication.authenticatorData;
    const credentialId = authentication.credentialId;

    var encoder = new TextEncoder();
    const parsedAuthData = parseAuthData(encoder.encode(authData).buffer);

    console.log(parsedAuthData);

    const aaguid = parsedAuthData.aaguid;
    const rpIdHash = parsedAuthData.rpIdHash;

    console.log(aaguid.split("-")[0]);
    const aaguidBuffer = encoder.encode(aaguid.split("-")[0]).buffer;
    const rpIdHashBuffer = encoder.encode(rpIdHash).buffer;

    const addedBuffer = concatenateBuffers(aaguidBuffer, rpIdHashBuffer);
    const BufferHex = bufferToHex(addedBuffer);

    const credentialIdHex = ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes(credentialId)
    );

    const sha256BufferHex = ethers.utils.sha256(
      ethers.utils.arrayify("0x" + BufferHex)
    );

    const concatenatedHex = sha256BufferHex + credentialIdHex.slice(2);

    const finalHash = ethers.utils.sha256(
      ethers.utils.arrayify(concatenatedHex)
    );
    console.log(finalHash);
  };

  const parseAuthData = (authData) => {
    let flags = new DataView(authData.slice(32, 33)).getUint8(0);
    //console.debug(flags)

    // https://w3c.github.io/webauthn/#sctn-authenticator-data
    let parsed = {
      rpIdHash: toBase64url(authData.slice(0, 32)),
      flags: {
        userPresent: !!(flags & 1),
        //reserved1: !!(flags & 2),
        userVerified: !!(flags & 4),
        backupEligibility: !!(flags & 8),
        backupState: !!(flags & 16),
        //reserved2: !!(flags & 32),
        attestedData: !!(flags & 64),
        extensionsIncluded: !!(flags & 128),
      },
      counter: new DataView(authData.slice(33, 37)).getUint32(0, false), // Big-Endian!
    };

    // this is more descriptive than "backupState"
    parsed.synced = parsed.flags.backupState;

    if (authData.byteLength > 37) {
      // registration contains additional data

      const aaguid = extractAaguid(authData); // bytes 37->53
      // https://w3c.github.io/webauthn/#attested-credential-data
      parsed = {
        ...parsed,
        aaguid,
        name: authenticatorMetadata[aaguid] ?? "Unknown",
      };
    }

    return parsed;
  };

  function toBase64url(buffer) {
    const txt = btoa(parseBuffer(buffer)); // base64
    return txt.replaceAll("+", "-").replaceAll("/", "_");
  }

  function extractAaguid(authData) {
    return formatAaguid(authData.slice(37, 53)); // 16 bytes
  }

  function formatAaguid(buffer) {
    let aaguid = bufferToHex(buffer);
    aaguid =
      aaguid.substring(0, 8) +
      "-" +
      aaguid.substring(8, 12) +
      "-" +
      aaguid.substring(12, 16) +
      "-" +
      aaguid.substring(16, 20) +
      "-" +
      aaguid.substring(20, 32);
    return aaguid; // example: "d41f5a69-b817-4144-a13c-9ebd6d9254d6"
  }

  function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function parseBuffer(buffer) {
    return String.fromCharCode(...new Uint8Array(buffer));
  }

  function base64urlToArrayBuffer(base64url) {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(base64);
    const rawLength = raw.length;
    const array = new Uint8Array(new ArrayBuffer(rawLength));

    for (let i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array.buffer;
  }

  function arrayBufferToString(arrayBuffer) {
    const byteArray = new Uint8Array(arrayBuffer);
    let str = "";
    for (let i = 0; i < byteArray.byteLength; i++) {
      str += String.fromCharCode(byteArray[i]);
    }
    return str;
  }

  function clientDataToJSON(clientData) {
    const arrayBuffer = base64urlToArrayBuffer(clientData);
    const str = arrayBufferToString(arrayBuffer);
    console.log(JSON.parse(str));
    return JSON.parse(str);
  }

  function concatenateBuffers(buffer1, buffer2) {
    let tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp;
  }

  return { register, login, parseAuthData, clientDataToJSON };
}
